import {
	applyMainToWorkerMessage,
	createInitialWorkerState,
	type WorkerRenderState,
} from './worker-state'
import type { MainToWorkerMessage, WorkerToMainMessage } from './worker.types'

/**
 * Абстракция транспорта main ↔ worker.
 * Позволяет подменять реальный Worker mock'ом в тестах.
 */
export type WorkerRenderPort = {
	post: (message: MainToWorkerMessage, transfer?: Transferable[]) => void
	subscribe: (handler: (message: WorkerToMainMessage) => void) => () => void
	terminate: () => void
}

export type MockWorkerPort = WorkerRenderPort & {
	/** Текущее pure-состояние machine (для assert'ов в тестах). */
	getState: () => WorkerRenderState
}

export type CreateMockWorkerPortOptions = {
	/** Начальное состояние; по умолчанию createInitialWorkerState(). */
	initialState?: WorkerRenderState
}

/**
 * In-process mock: post → applyMainToWorkerMessage → subscribe handlers.
 * Не создаёт DOM Worker.
 */
export const createMockWorkerPort = (
	options: CreateMockWorkerPortOptions = {},
): MockWorkerPort => {
	let state = options.initialState ?? createInitialWorkerState()
	const handlers = new Set<(message: WorkerToMainMessage) => void>()
	let terminated = false

	const emit = (replies: WorkerToMainMessage[]) => {
		for (const reply of replies) {
			for (const handler of handlers) {
				handler(reply)
			}
		}
	}

	return {
		post: (message) => {
			if (terminated) {
				return
			}
			const result = applyMainToWorkerMessage(state, message)
			state = result.state
			emit(result.replies)
		},
		subscribe: (handler) => {
			handlers.add(handler)
			return () => {
				handlers.delete(handler)
			}
		},
		terminate: () => {
			terminated = true
			handlers.clear()
			if (!state.disposed) {
				const result = applyMainToWorkerMessage(state, { type: 'dispose' })
				state = result.state
			}
		},
		getState: () => state,
	}
}

export type RealWorkerPortOptions = {
	worker: Worker
}

/**
 * Тонкая обёртка над `Worker` для production opt-in пути.
 * Transferable (OffscreenCanvas) передаются вторым аргументом postMessage.
 */
export const createRealWorkerPort = ({ worker }: RealWorkerPortOptions): WorkerRenderPort => {
	const handlers = new Set<(message: WorkerToMainMessage) => void>()

	const onMessage = (event: MessageEvent<WorkerToMainMessage>) => {
		const data = event.data
		for (const handler of handlers) {
			handler(data)
		}
	}

	worker.addEventListener('message', onMessage)

	return {
		post: (message, transfer) => {
			if (transfer?.length) {
				worker.postMessage(message, transfer)
				return
			}
			worker.postMessage(message)
		},
		subscribe: (handler) => {
			handlers.add(handler)
			return () => {
				handlers.delete(handler)
			}
		},
		terminate: () => {
			worker.removeEventListener('message', onMessage)
			handlers.clear()
			worker.terminate()
		},
	}
}
