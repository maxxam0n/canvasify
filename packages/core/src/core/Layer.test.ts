import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ShapeDrawingContext } from '../model/shape.types'
import { createMockCanvas, createMockContext, createMockDocument } from '../__tests__/test.utils'
import { baseShapeToDrawingContext } from '../lib/shape-context.utils'
import {
	createMockWorkerPort,
	type MainToWorkerMessage,
} from '../worker'
import { Layer } from './Layer'
import { RectShape } from './shapes/Rect'

describe('Layer', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 2 })
		// jsdom/node: без OffscreenCanvas — HTMLCanvasElement fallback для bitmap-кеша
		vi.stubGlobal('OffscreenCanvas', undefined)
	})

	it('sets size with devicePixelRatio and marks dirty', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const onDirty = vi.fn()

		const layer = new Layer({ name: 'main', canvas, onDirty })
		layer.setSize(100, 50)

		expect(canvas.width).toBe(200)
		expect(canvas.height).toBe(100)
		expect(canvas.style.width).toBe('100px')
		expect(canvas.style.height).toBe('50px')
		expect(onDirty).toHaveBeenCalledTimes(1)

		expect(calls).toEqual([
			{ name: 'setTransform', args: [1, 0, 0, 1, 0, 0] },
			{ name: 'scale', args: [2, 2] },
		])
	})

	it('uses renderer when provided and clears dirty flag', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const renderer = vi.fn()

		const layer = new Layer({ name: 'main', canvas, renderer })
		layer.makeDirty()
		layer.render()
		layer.render()

		expect(renderer).toHaveBeenCalledTimes(1)
	})

	it('renders shapes when dirty and no custom renderer', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const drawOrder: string[] = []

		const shape: ShapeDrawingContext = {
			id: 'shape-1',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => {
				drawOrder.push('transform')
			},
			draw: () => {
				drawOrder.push('draw')
			},
			getLocalBounds: () => ({ x: 10, y: 20, width: 30, height: 40 }),
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(200, 100)
		layer.render()
		calls.length = 0
		layer.setShape(shape)
		layer.render()

		expect(drawOrder).toEqual(['transform', 'draw'])
		expect(calls.filter(call => call.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [9, 19, 32, 42] },
		])
		expect(calls.some(call => call.name === 'clip')).toBe(true)
	})

	it('inflates dirty region for shadow effects', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const shape: ShapeDrawingContext = {
			id: 'shadow-shape',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: () => undefined,
			getLocalBounds: () => ({ x: 10, y: 20, width: 30, height: 40 }),
			shadowColor: 'black',
			shadowBlur: 5,
			shadowOffsetX: 3,
			shadowOffsetY: 4,
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(200, 100)
		layer.render()
		calls.length = 0
		layer.setShape(shape)
		layer.render()

		expect(calls.filter(call => call.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [4, 14, 45, 56] },
		])
	})

	it('uses full dirty when shape has non-source-over composite', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const shape: ShapeDrawingContext = {
			id: 'composite-shape',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: () => undefined,
			getLocalBounds: () => ({ x: 10, y: 20, width: 30, height: 40 }),
			globalCompositeOperation: 'multiply',
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 50)
		layer.render()
		calls.length = 0
		layer.setShape(shape)
		layer.render()

		expect(calls.filter(call => call.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [0, 0, 100, 50] },
		])
		expect(calls.some(call => call.name === 'clip')).toBe(false)
	})

	it('falls back to full clear when shape has no bounds', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const shape: ShapeDrawingContext = {
			id: 'shape-1',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: () => undefined,
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 50)
		calls.length = 0
		layer.setShape(shape)
		layer.render()

		expect(calls.filter(call => call.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [0, 0, 100, 50] },
		])
	})

	it('makeDirty with region uses clip redraw', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 100)
		layer.render()
		calls.length = 0

		layer.makeDirty({ x: 5, y: 5, width: 10, height: 10 })
		layer.render()

		expect(calls.filter(call => call.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [4, 4, 12, 12] },
		])
	})

	it('uses source canvas when export does not need transforms', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const documentStub = createMockDocument(() => createMockCanvas())

		vi.stubGlobal('document', documentStub)

		const layer = new Layer({ name: 'main', canvas })
		layer.makeDirty()
		layer.toDataURL()

		const createElementMock = documentStub.createElement as unknown as ReturnType<typeof vi.fn>
		const toDataURLMock = canvas.toDataURL as unknown as ReturnType<typeof vi.fn>

		expect(createElementMock).not.toHaveBeenCalled()
		expect(toDataURLMock).toHaveBeenCalledTimes(1)
	})

	it('setOpacity updates style and getter without recreate', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const layer = new Layer({ name: 'main', canvas, opacity: 0.5 })
		expect(layer.opacity).toBe(0.5)
		expect(canvas.style.opacity).toBe('0.5')

		layer.setOpacity(0.25)
		expect(layer.opacity).toBe(0.25)
		expect(canvas.style.opacity).toBe('0.25')
	})

	it('setZIndex updates style and getter without recreate', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)

		const layer = new Layer({ name: 'main', canvas, zIndex: 3 })
		expect(layer.zIndex).toBe(3)
		expect(canvas.style.zIndex).toBe('3')

		layer.setZIndex(7)
		expect(layer.zIndex).toBe(7)
		expect(canvas.style.zIndex).toBe('7')
	})

	it('setRenderer replaces renderer and marks dirty', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const first = vi.fn()
		const second = vi.fn()

		const layer = new Layer({ name: 'main', canvas, renderer: first })
		layer.makeDirty()
		layer.render()
		expect(first).toHaveBeenCalledTimes(1)

		layer.setRenderer(second)
		layer.render()
		expect(second).toHaveBeenCalledTimes(1)
	})

	it('cache blits snapshot on render in static mode', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const { ctx: cacheCtx, calls: cacheCalls } = createMockContext()
		const cacheCanvas = createMockCanvas(cacheCtx).canvas
		const documentStub = createMockDocument(() => ({ canvas: cacheCanvas, ctx: cacheCtx, calls: [] }))

		vi.stubGlobal('document', documentStub)

		let drawCount = 0
		const sharedDraw = () => {
			drawCount += 1
		}
		const makeShape = (id: string, x: number): ShapeDrawingContext => ({
			id,
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: sharedDraw,
			getLocalBounds: () => ({ x, y: 0, width: 10, height: 10 }),
		})

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 50)
		layer.setShape(makeShape('shape-1', 0))
		layer.setShape(makeShape('shape-2', 20))
		layer.render()
		expect(drawCount).toBe(2)

		layer.cache()
		layer.setStatic(true)
		const drawCountAfterCache = drawCount
		calls.length = 0

		layer.makeDirty()
		layer.render()

		expect(drawCount).toBe(drawCountAfterCache)
		expect(calls.filter(call => call.name === 'setTransform')).toEqual(
			expect.arrayContaining([
				{ name: 'setTransform', args: [1, 0, 0, 1, 0, 0] },
				{ name: 'setTransform', args: [2, 0, 0, 2, 0, 0] },
			]),
		)
		expect(calls.filter(call => call.name === 'clearRect')).toContainEqual({
			name: 'clearRect',
			args: [0, 0, canvas.width, canvas.height],
		})
		expect(calls.filter(call => call.name === 'drawImage')).toEqual([
			{ name: 'drawImage', args: [cacheCanvas, 0, 0] },
		])
		expect(cacheCalls.filter(call => call.name === 'drawImage')).toEqual([
			{ name: 'drawImage', args: [canvas, 0, 0] },
		])
	})

	it('setShape invalidates cache and redraws shapes', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const { ctx: cacheCtx } = createMockContext()
		const cacheCanvas = createMockCanvas(cacheCtx).canvas
		const documentStub = createMockDocument(() => ({ canvas: cacheCanvas, ctx: cacheCtx, calls: [] }))

		vi.stubGlobal('document', documentStub)

		let drawCount = 0
		const firstShape: ShapeDrawingContext = {
			id: 'shape-1',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: () => {
				drawCount += 1
			},
			getLocalBounds: () => ({ x: 0, y: 0, width: 10, height: 10 }),
		}
		const secondShape: ShapeDrawingContext = {
			...firstShape,
			id: 'shape-2',
			getLocalBounds: () => ({ x: 20, y: 0, width: 10, height: 10 }),
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 50)
		layer.setShape(firstShape)
		layer.render()
		layer.cache()
		layer.setStatic(true)

		drawCount = 0
		calls.length = 0
		layer.setShape(secondShape)
		layer.render()

		// После invalidate кеша перерисовываются все фигуры слоя (shape-1 + shape-2).
		expect(drawCount).toBe(2)
		expect(calls.some(call => call.name === 'clip')).toBe(true)
	})

	it('static mode skips shape re-render while cache is valid', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const { ctx: cacheCtx } = createMockContext()
		const cacheCanvas = createMockCanvas(cacheCtx).canvas
		const documentStub = createMockDocument(() => ({ canvas: cacheCanvas, ctx: cacheCtx, calls: [] }))

		vi.stubGlobal('document', documentStub)

		const draw = vi.fn()
		const shape: ShapeDrawingContext = {
			id: 'shape-1',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw,
			getLocalBounds: () => ({ x: 0, y: 0, width: 10, height: 10 }),
		}

		const layer = new Layer({ name: 'main', canvas, static: true })
		layer.setSize(100, 50)
		layer.setShape(shape)
		layer.render()
		layer.cache()

		draw.mockClear()
		calls.length = 0

		layer.makeDirty({ x: 0, y: 0, width: 5, height: 5 })
		layer.render()

		expect(draw).not.toHaveBeenCalled()
		expect(calls.some(call => call.name === 'drawImage')).toBe(true)
	})

	it('cache is no-op with custom renderer', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const documentStub = createMockDocument(() => createMockCanvas())
		const renderer = vi.fn()

		vi.stubGlobal('document', documentStub)

		const layer = new Layer({ name: 'main', canvas, renderer })
		layer.makeDirty()
		layer.cache()

		const createElementMock = documentStub.createElement as unknown as ReturnType<typeof vi.fn>
		expect(createElementMock).not.toHaveBeenCalled()
	})

	it('cache prefers OffscreenCanvas when available', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const { ctx: cacheCtx, calls: cacheCalls } = createMockContext()
		const offscreenCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => cacheCtx),
		}
		const OffscreenCanvasMock = vi.fn(function OffscreenCanvasMock(
			this: typeof offscreenCanvas,
			width: number,
			height: number,
		) {
			offscreenCanvas.width = width
			offscreenCanvas.height = height
			return offscreenCanvas
		})
		const createElement = vi.fn()

		vi.stubGlobal('OffscreenCanvas', OffscreenCanvasMock)
		vi.stubGlobal('document', { createElement })

		const shape: ShapeDrawingContext = {
			id: 'shape-1',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			transform: () => undefined,
			draw: () => undefined,
			getLocalBounds: () => ({ x: 0, y: 0, width: 10, height: 10 }),
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setSize(100, 50)
		layer.setShape(shape)
		layer.render()
		layer.cache()
		layer.setStatic(true)

		expect(OffscreenCanvasMock).toHaveBeenCalled()
		expect(createElement).not.toHaveBeenCalled()
		expect(cacheCalls.filter(call => call.name === 'drawImage')).toEqual([
			{ name: 'drawImage', args: [canvas, 0, 0] },
		])

		calls.length = 0
		layer.makeDirty()
		layer.render()

		expect(calls.filter(call => call.name === 'drawImage')).toEqual([
			{ name: 'drawImage', args: [offscreenCanvas, 0, 0] },
		])
		expect(calls.filter(call => call.name === 'setTransform')).toEqual(
			expect.arrayContaining([
				{ name: 'setTransform', args: [1, 0, 0, 1, 0, 0] },
				{ name: 'setTransform', args: [2, 0, 0, 2, 0, 0] },
			]),
		)
	})
})

describe('Layer workerRenderer', () => {
	let posted: MainToWorkerMessage[] = []

	const installWorkerGlobals = () => {
		vi.stubGlobal('window', { devicePixelRatio: 2 })
		vi.stubGlobal(
			'OffscreenCanvas',
			class OffscreenCanvas {
				width = 0
				height = 0
			},
		)
		// node env: нет DOM HTMLCanvasElement — ставим stub для feature-detect
		class HTMLCanvasElementStub {
			width = 0
			height = 0
		}
		vi.stubGlobal('HTMLCanvasElement', HTMLCanvasElementStub)
		Object.defineProperty(HTMLCanvasElementStub.prototype, 'transferControlToOffscreen', {
			configurable: true,
			writable: true,
			value: function transferControlToOffscreen(this: { width: number; height: number }) {
				return new OffscreenCanvas(this.width, this.height)
			},
		})
	}

	const createWorkerLayer = () => {
		posted = []
		const { canvas } = createMockCanvas()
		const offscreen = { width: 0, height: 0 } as OffscreenCanvas
		;(
			canvas as HTMLCanvasElement & {
				transferControlToOffscreen: () => OffscreenCanvas
			}
		).transferControlToOffscreen = vi.fn(() => offscreen)

		const port = createMockWorkerPort()
		const originalPost = port.post.bind(port)
		port.post = (message, transfer) => {
			posted.push(message)
			originalPost(message, transfer)
		}

		const layer = new Layer({
			name: 'worker',
			canvas,
			workerRenderer: {
				createWorker: () => {
					throw new Error('createWorker should not be called when port is injected')
				},
				port,
			},
		})

		return { layer, canvas, port }
	}

	beforeEach(() => {
		installWorkerGlobals()
	})

	it('does not call getContext in constructor', () => {
		const { canvas } = createMockCanvas()
		;(
			canvas as HTMLCanvasElement & {
				transferControlToOffscreen: () => OffscreenCanvas
			}
		).transferControlToOffscreen = vi.fn(
			() => ({ width: 0, height: 0 }) as OffscreenCanvas,
		)

		const getContext = canvas.getContext as unknown as ReturnType<typeof vi.fn>
		const port = createMockWorkerPort()

		const layer = new Layer({
			name: 'worker',
			canvas,
			workerRenderer: {
				createWorker: () => {
					throw new Error('unused')
				},
				port,
			},
		})

		expect(getContext).not.toHaveBeenCalled()
		expect(layer.ctx).toBeUndefined()
	})

	it('posts setShapes and render after setShape with RectShape source', () => {
		const { layer } = createWorkerLayer()
		layer.setSize(100, 50)

		expect(posted.some(message => message.type === 'init')).toBe(true)
		expect(posted.filter(message => message.type === 'init')).toHaveLength(1)

		const rect = new RectShape({
			x: 10,
			y: 20,
			width: 30,
			height: 40,
			fillColor: 'red',
		})
		const ctx = baseShapeToDrawingContext(rect, { id: 'rect-1' })

		posted = []
		layer.setShape(ctx, { source: rect })

		expect(posted).toEqual([
			expect.objectContaining({
				type: 'setShapes',
				shapes: [
					expect.objectContaining({
						kind: 'rect',
						id: 'rect-1',
						x: 10,
						y: 20,
						width: 30,
						height: 40,
					}),
				],
			}),
		])

		posted = []
		layer.render()

		// После setSize слой fully dirty — render шлёт dirtyFull (не region).
		expect(posted).toEqual([
			expect.objectContaining({
				type: 'render',
				dirtyFull: true,
			}),
		])
	})

	it('throws when setShape is missing source in worker mode', () => {
		const { layer } = createWorkerLayer()
		layer.setSize(100, 50)

		const rect = new RectShape({ x: 0, y: 0, width: 10, height: 10, fillColor: 'blue' })
		const ctx = baseShapeToDrawingContext(rect, { id: 'rect-1' })

		expect(() => layer.setShape(ctx)).toThrow(
			'Layer.setShape requires options.source when workerRenderer is enabled',
		)
	})

	it('hitTest still works on worker layer using main-thread shapes', () => {
		const { layer } = createWorkerLayer()
		layer.setSize(100, 50)

		const rect = new RectShape({
			x: 10,
			y: 10,
			width: 40,
			height: 40,
			fillColor: 'green',
		})
		const ctx = baseShapeToDrawingContext(rect, { id: 'hit-rect' })
		layer.setShape(ctx, { source: rect })

		expect(layer.hitTest(20, 20)?.shapeId).toBe('hit-rect')
		expect(layer.hitTest(0, 0)).toBeUndefined()
	})

	it('cache() throws in worker mode', () => {
		const { layer } = createWorkerLayer()
		layer.setSize(100, 50)

		expect(() => layer.cache()).toThrow(
			'Layer.cache() is not supported when workerRenderer is enabled',
		)
	})
})
