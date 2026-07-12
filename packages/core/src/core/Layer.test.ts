import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ShapeDrawingContext } from '../model/shape.types'
import { createMockCanvas, createMockContext, createMockDocument } from '../__tests__/test.utils'
import { Layer } from './Layer'

describe('Layer', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 2 })
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
})
