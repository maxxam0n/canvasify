import { describe, expect, it, vi } from 'vitest'

import {
	WORKER_PROTOCOL_VERSION,
	applyMainToWorkerMessage,
	createInitialWorkerState,
	createMockWorkerPort,
	createRealWorkerPort,
	type MainToWorkerMessage,
	type WorkerShapeSnapshot,
	type WorkerToMainMessage,
} from './index'

const fakeCanvas = {} as OffscreenCanvas

const initMessage = (
	overrides: Partial<Extract<MainToWorkerMessage, { type: 'init' }>> = {},
): Extract<MainToWorkerMessage, { type: 'init' }> => ({
	type: 'init',
	protocolVersion: WORKER_PROTOCOL_VERSION,
	logicalWidth: 200,
	logicalHeight: 100,
	dpr: 2,
	canvas: fakeCanvas,
	...overrides,
})

const sampleRect = (id = 'r1'): WorkerShapeSnapshot => ({
	kind: 'rect',
	id,
	zIndex: 0,
	opacity: 1,
	x: 10,
	y: 20,
	width: 30,
	height: 40,
	fillColor: '#ff0000',
})

const sampleCircle = (id = 'c1'): WorkerShapeSnapshot => ({
	kind: 'circle',
	id,
	zIndex: 1,
	opacity: 0.8,
	cx: 50,
	cy: 60,
	radius: 15,
	strokeColor: '#00ff00',
	lineWidth: 2,
})

describe('worker protocol state machine', () => {
	it('round-trip: init → ready, setShapes, render → frameDone', () => {
		let state = createInitialWorkerState()

		const initResult = applyMainToWorkerMessage(state, initMessage())
		expect(initResult.replies).toEqual([
			{ type: 'ready', protocolVersion: WORKER_PROTOCOL_VERSION },
		])
		expect(initResult.state.initialized).toBe(true)
		expect(initResult.state.hasCanvas).toBe(true)
		expect(initResult.state.logicalWidth).toBe(200)
		expect(initResult.state.logicalHeight).toBe(100)
		expect(initResult.state.dpr).toBe(2)
		state = initResult.state

		const shapes = [sampleRect(), sampleCircle()]
		const setResult = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 1,
			shapes,
		})
		expect(setResult.replies).toEqual([])
		expect(setResult.state.shapes).toEqual(shapes)
		expect(setResult.state.lastRevision).toBe(1)
		state = setResult.state

		const renderResult = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 1,
			dirtyFull: false,
			dirtyRects: [{ x: 0, y: 0, width: 10, height: 10 }],
		})
		expect(renderResult.replies).toEqual([{ type: 'frameDone', revision: 1 }])
		expect(renderResult.state.dirtyFull).toBe(false)
		expect(renderResult.state.dirtyRects).toEqual([{ x: 0, y: 0, width: 10, height: 10 }])
	})

	it('accepts all snapshot kinds in setShapes', () => {
		let state = applyMainToWorkerMessage(createInitialWorkerState(), initMessage()).state

		const shapes: WorkerShapeSnapshot[] = [
			sampleRect('rect'),
			sampleCircle('circle'),
			{
				kind: 'ellipse',
				id: 'ellipse',
				zIndex: 2,
				opacity: 1,
				cx: 1,
				cy: 2,
				radiusX: 3,
				radiusY: 4,
				rotation: 0.5,
			},
			{
				kind: 'line',
				id: 'line',
				zIndex: 3,
				opacity: 1,
				x1: 0,
				y1: 0,
				x2: 10,
				y2: 10,
				strokeColor: '#000',
			},
			{
				kind: 'polygon',
				id: 'polygon',
				zIndex: 4,
				opacity: 1,
				points: [
					{ x: 0, y: 0 },
					{ x: 5, y: 0 },
					{ x: 5, y: 5 },
				],
				closed: true,
			},
			{
				kind: 'path',
				id: 'path',
				zIndex: 5,
				opacity: 1,
				commands: [
					{ type: 'moveTo', x: 0, y: 0 },
					{ type: 'lineTo', x: 1, y: 1 },
					{ type: 'closePath' },
				],
			},
		]

		state = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 2,
			shapes,
		}).state

		expect(state.shapes.map(shape => shape.kind)).toEqual([
			'rect',
			'circle',
			'ellipse',
			'line',
			'polygon',
			'path',
		])
	})

	it('coalesces stale revisions and keeps newer shapes', () => {
		let state = applyMainToWorkerMessage(createInitialWorkerState(), initMessage()).state

		state = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 3,
			shapes: [sampleRect('new')],
		}).state

		const staleSet = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 2,
			shapes: [sampleRect('stale')],
		})
		expect(staleSet.replies).toEqual([])
		expect(staleSet.state.shapes).toEqual([sampleRect('new')])
		expect(staleSet.state.lastRevision).toBe(3)
		state = staleSet.state

		const freshRender = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 4,
			dirtyFull: true,
		})
		expect(freshRender.replies).toEqual([{ type: 'frameDone', revision: 4 }])
		state = freshRender.state

		const staleRender = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 3,
			dirtyFull: false,
			dirtyRects: [{ x: 1, y: 1, width: 1, height: 1 }],
		})
		expect(staleRender.replies).toEqual([])
		expect(staleRender.state.lastRevision).toBe(4)
		expect(staleRender.state.dirtyFull).toBe(true)
	})

	it('allows same revision for setShapes then render (one frame batch)', () => {
		let state = applyMainToWorkerMessage(createInitialWorkerState(), initMessage()).state

		state = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 5,
			shapes: [sampleCircle()],
		}).state

		const renderResult = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 5,
			dirtyFull: true,
		})

		expect(renderResult.replies).toEqual([{ type: 'frameDone', revision: 5 }])
		expect(renderResult.state.lastRevision).toBe(5)
	})

	it('resize marks dirtyFull and updates size', () => {
		let state = applyMainToWorkerMessage(createInitialWorkerState(), initMessage()).state
		state = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 1,
			dirtyFull: false,
			dirtyRects: [{ x: 0, y: 0, width: 5, height: 5 }],
		}).state

		const resized = applyMainToWorkerMessage(state, {
			type: 'resize',
			logicalWidth: 400,
			logicalHeight: 300,
			dpr: 1.5,
		})

		expect(resized.replies).toEqual([])
		expect(resized.state.logicalWidth).toBe(400)
		expect(resized.state.logicalHeight).toBe(300)
		expect(resized.state.dpr).toBe(1.5)
		expect(resized.state.dirtyFull).toBe(true)
		expect(resized.state.dirtyRects).toEqual([])
	})

	it('dispose clears runtime and rejects further commands', () => {
		let state = applyMainToWorkerMessage(createInitialWorkerState(), initMessage()).state
		state = applyMainToWorkerMessage(state, {
			type: 'setShapes',
			revision: 1,
			shapes: [sampleRect()],
		}).state

		const disposed = applyMainToWorkerMessage(state, { type: 'dispose' })
		expect(disposed.replies).toEqual([])
		expect(disposed.state.disposed).toBe(true)
		expect(disposed.state.initialized).toBe(false)
		expect(disposed.state.shapes).toEqual([])
		expect(disposed.state.hasCanvas).toBe(false)
		state = disposed.state

		const after = applyMainToWorkerMessage(state, {
			type: 'render',
			revision: 2,
			dirtyFull: true,
		})
		expect(after.replies).toEqual([
			{ type: 'error', code: 'ALREADY_DISPOSED', message: 'Worker already disposed' },
		])
		expect(after.state.disposed).toBe(true)

		const doubleDispose = applyMainToWorkerMessage(state, { type: 'dispose' })
		expect(doubleDispose.replies).toEqual([])
	})

	it('rejects protocol mismatch and commands before init', () => {
		const mismatch = applyMainToWorkerMessage(
			createInitialWorkerState(),
			initMessage({ protocolVersion: 999 }),
		)
		expect(mismatch.replies[0]).toMatchObject({
			type: 'error',
			code: 'PROTOCOL_MISMATCH',
		})
		expect(mismatch.state.initialized).toBe(false)

		const beforeInit = applyMainToWorkerMessage(createInitialWorkerState(), {
			type: 'setShapes',
			revision: 1,
			shapes: [],
		})
		expect(beforeInit.replies[0]).toMatchObject({
			type: 'error',
			code: 'NOT_INITIALIZED',
		})
	})
})

describe('createMockWorkerPort', () => {
	it('round-trips messages through subscribe handlers', () => {
		const port = createMockWorkerPort()
		const replies: WorkerToMainMessage[] = []
		const unsubscribe = port.subscribe(message => {
			replies.push(message)
		})

		port.post(initMessage())
		port.post({
			type: 'setShapes',
			revision: 1,
			shapes: [sampleRect()],
		})
		port.post({
			type: 'render',
			revision: 1,
			dirtyFull: true,
		})

		expect(replies).toEqual([
			{ type: 'ready', protocolVersion: WORKER_PROTOCOL_VERSION },
			{ type: 'frameDone', revision: 1 },
		])
		expect(port.getState().shapes).toEqual([sampleRect()])

		unsubscribe()
		const spy = vi.fn()
		port.subscribe(spy)
		port.post({
			type: 'render',
			revision: 2,
			dirtyFull: true,
		})
		expect(spy).toHaveBeenCalledWith({ type: 'frameDone', revision: 2 })
	})

	it('terminate disposes and ignores further posts', () => {
		const port = createMockWorkerPort()
		const replies: WorkerToMainMessage[] = []
		port.subscribe(message => {
			replies.push(message)
		})

		port.post(initMessage())
		port.terminate()

		expect(port.getState().disposed).toBe(true)

		replies.length = 0
		port.post({
			type: 'render',
			revision: 1,
			dirtyFull: true,
		})
		port.terminate()
		expect(replies).toEqual([])
		expect(port.getState().disposed).toBe(true)
	})

	it('terminates a real worker port idempotently and ignores later work', () => {
		const worker = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			postMessage: vi.fn(),
			terminate: vi.fn(),
		} as unknown as Worker
		const port = createRealWorkerPort({ worker })

		port.terminate()
		port.terminate()
		port.post(initMessage())
		const unsubscribe = port.subscribe(vi.fn())
		unsubscribe()

		expect(worker.removeEventListener).toHaveBeenCalledTimes(1)
		expect(worker.terminate).toHaveBeenCalledTimes(1)
		expect(worker.postMessage).not.toHaveBeenCalled()
	})
})
