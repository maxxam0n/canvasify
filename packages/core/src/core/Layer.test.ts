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
		}

		const layer = new Layer({ name: 'main', canvas })
		layer.setShape(shape)
		layer.render()

		expect(drawOrder).toEqual(['transform', 'draw'])
		expect(calls.filter(call => call.name === 'clearRect')).toHaveLength(1)
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
})
