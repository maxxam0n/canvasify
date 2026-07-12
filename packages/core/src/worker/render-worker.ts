/**
 * Entry-скрипт worker paint loop.
 * Бандл: `@maxxam0n/canvasify-core/render-worker` → dist/canvasify-render-worker.js
 */
import { drawWorkerShapes } from './draw-worker-shapes'
import {
	applyMainToWorkerMessage,
	createInitialWorkerState,
	type WorkerRenderState,
} from './worker-state'
import type { MainToWorkerMessage, WorkerToMainMessage } from './worker.types'

/** Минимальный worker scope без /// <reference lib="webworker" /> (конфликт с DOM lib пакета). */
type PaintWorkerScope = {
	postMessage: (message: WorkerToMainMessage) => void
	onmessage: ((event: MessageEvent<MainToWorkerMessage>) => void) | null
}

const workerScope = self as unknown as PaintWorkerScope

let state: WorkerRenderState = createInitialWorkerState()
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

const post = (message: WorkerToMainMessage): void => {
	workerScope.postMessage(message)
}

/** Синхронизирует физический размер OffscreenCanvas и DPR-scale CTM. */
const syncCanvasSurface = (): void => {
	if (!canvas || !ctx) return

	const { logicalWidth, logicalHeight, dpr } = state
	canvas.width = Math.max(1, Math.floor(logicalWidth * dpr))
	canvas.height = Math.max(1, Math.floor(logicalHeight * dpr))
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.scale(dpr, dpr)
}

const paintFrame = (): void => {
	if (!ctx) return

	drawWorkerShapes(ctx, state.shapes, {
		dirtyFull: state.dirtyFull,
		dirtyRects: state.dirtyRects,
		logicalWidth: state.logicalWidth,
		logicalHeight: state.logicalHeight,
	})
}

const clearSurface = (): void => {
	canvas = null
	ctx = null
}

const handleMessage = (message: MainToWorkerMessage): void => {
	if (message.type === 'init') {
		canvas = message.canvas
		ctx = canvas.getContext('2d')
	}

	const result = applyMainToWorkerMessage(state, message)
	state = result.state

	if (message.type === 'init' && !state.initialized) {
		// Init отклонён (protocol / already init) — не держим чужой canvas.
		clearSurface()
	}

	if (
		(message.type === 'init' || message.type === 'resize') &&
		state.initialized &&
		!state.disposed
	) {
		syncCanvasSurface()
	}

	const shouldPaint = result.replies.some(reply => reply.type === 'frameDone')
	if (shouldPaint) {
		paintFrame()
	}

	for (const reply of result.replies) {
		post(reply)
	}

	if (message.type === 'dispose') {
		clearSurface()
	}
}

workerScope.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
	handleMessage(event.data)
}
