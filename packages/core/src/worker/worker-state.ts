import type { Rect } from '../model/rect.types'
import {
	WORKER_PROTOCOL_VERSION,
	type MainToWorkerMessage,
	type WorkerErrorCode,
	type WorkerShapeSnapshot,
	type WorkerToMainMessage,
} from './worker.types'

/**
 * Чистый in-memory снимок состояния worker render loop.
 * Без DOM Worker / реального OffscreenCanvas — удобно для unit-тестов.
 */
export type WorkerRenderState = {
	disposed: boolean
	initialized: boolean
	protocolVersion: number | null
	logicalWidth: number
	logicalHeight: number
	dpr: number
	shapes: WorkerShapeSnapshot[]
	/**
	 * Максимальная принятая revision (setShapes / render).
	 * Stale-сообщения с меньшим revision отбрасываются.
	 */
	lastRevision: number
	dirtyFull: boolean
	dirtyRects: Rect[]
	/** Флаг transfer'а canvas; сам OffscreenCanvas в pure-state не хранится. */
	hasCanvas: boolean
}

export type ApplyMainToWorkerResult = {
	state: WorkerRenderState
	replies: WorkerToMainMessage[]
}

export const createInitialWorkerState = (): WorkerRenderState => ({
	disposed: false,
	initialized: false,
	protocolVersion: null,
	logicalWidth: 0,
	logicalHeight: 0,
	dpr: 1,
	shapes: [],
	lastRevision: 0,
	dirtyFull: true,
	dirtyRects: [],
	hasCanvas: false,
})

const workerError = (code: WorkerErrorCode, message: string): WorkerToMainMessage => ({
	type: 'error',
	code,
	message,
})

const isStaleRevision = (state: WorkerRenderState, revision: number): boolean =>
	revision < state.lastRevision

const acceptRevision = (state: WorkerRenderState, revision: number): WorkerRenderState => ({
	...state,
	lastRevision: Math.max(state.lastRevision, revision),
})

/**
 * Pure-обработчик команд main → worker.
 * Возвращает новое состояние и список ответов worker → main.
 */
export const applyMainToWorkerMessage = (
	state: WorkerRenderState,
	message: MainToWorkerMessage,
): ApplyMainToWorkerResult => {
	if (state.disposed) {
		if (message.type === 'dispose') {
			return { state, replies: [] }
		}
		return {
			state,
			replies: [workerError('ALREADY_DISPOSED', 'Worker already disposed')],
		}
	}

	switch (message.type) {
		case 'init':
			return applyInit(state, message)
		case 'setShapes':
			return applySetShapes(state, message)
		case 'render':
			return applyRender(state, message)
		case 'resize':
			return applyResize(state, message)
		case 'dispose':
			return applyDispose(state)
		default: {
			const _exhaustive: never = message
			return {
				state,
				replies: [workerError('INVALID_STATE', `Unknown message: ${String(_exhaustive)}`)],
			}
		}
	}
}

const applyInit = (
	state: WorkerRenderState,
	message: Extract<MainToWorkerMessage, { type: 'init' }>,
): ApplyMainToWorkerResult => {
	if (state.initialized) {
		return {
			state,
			replies: [workerError('ALREADY_INITIALIZED', 'Worker already initialized')],
		}
	}

	if (message.protocolVersion !== WORKER_PROTOCOL_VERSION) {
		return {
			state,
			replies: [
				workerError(
					'PROTOCOL_MISMATCH',
					`Expected protocolVersion ${WORKER_PROTOCOL_VERSION}, got ${message.protocolVersion}`,
				),
			],
		}
	}

	return {
		state: {
			...state,
			initialized: true,
			protocolVersion: message.protocolVersion,
			logicalWidth: message.logicalWidth,
			logicalHeight: message.logicalHeight,
			dpr: message.dpr,
			hasCanvas: message.canvas != null,
			dirtyFull: true,
			dirtyRects: [],
		},
		replies: [{ type: 'ready', protocolVersion: WORKER_PROTOCOL_VERSION }],
	}
}

const applySetShapes = (
	state: WorkerRenderState,
	message: Extract<MainToWorkerMessage, { type: 'setShapes' }>,
): ApplyMainToWorkerResult => {
	if (!state.initialized) {
		return {
			state,
			replies: [workerError('NOT_INITIALIZED', 'Call init before setShapes')],
		}
	}

	if (isStaleRevision(state, message.revision)) {
		// Stale batch: main уже отправил более новый revision — пропускаем.
		return { state, replies: [] }
	}

	return {
		state: {
			...acceptRevision(state, message.revision),
			shapes: message.shapes.slice(),
		},
		replies: [],
	}
}

const applyRender = (
	state: WorkerRenderState,
	message: Extract<MainToWorkerMessage, { type: 'render' }>,
): ApplyMainToWorkerResult => {
	if (!state.initialized) {
		return {
			state,
			replies: [workerError('NOT_INITIALIZED', 'Call init before render')],
		}
	}

	if (isStaleRevision(state, message.revision)) {
		return { state, replies: [] }
	}

	const next = acceptRevision(state, message.revision)

	// W1: фиксируем dirty-intent последнего принятого кадра; paint — в W2.
	const withDirty: WorkerRenderState = message.dirtyFull
		? { ...next, dirtyFull: true, dirtyRects: [] }
		: {
				...next,
				dirtyFull: false,
				dirtyRects: message.dirtyRects ? message.dirtyRects.slice() : [],
			}

	return {
		state: withDirty,
		replies: [{ type: 'frameDone', revision: message.revision }],
	}
}

const applyResize = (
	state: WorkerRenderState,
	message: Extract<MainToWorkerMessage, { type: 'resize' }>,
): ApplyMainToWorkerResult => {
	if (!state.initialized) {
		return {
			state,
			replies: [workerError('NOT_INITIALIZED', 'Call init before resize')],
		}
	}

	return {
		state: {
			...state,
			logicalWidth: message.logicalWidth,
			logicalHeight: message.logicalHeight,
			dpr: message.dpr,
			dirtyFull: true,
			dirtyRects: [],
		},
		replies: [],
	}
}

const applyDispose = (state: WorkerRenderState): ApplyMainToWorkerResult => ({
	state: {
		...createInitialWorkerState(),
		disposed: true,
		lastRevision: state.lastRevision,
	},
	replies: [],
})
