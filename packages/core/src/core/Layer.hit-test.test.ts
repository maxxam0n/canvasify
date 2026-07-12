import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockCanvas, createMockContext } from '../__tests__/test.utils'
import { Layer } from '../core/Layer'
import { RectShape } from '../core/shapes/Rect'
import { CircleShape } from '../core/shapes/Circle'
import { baseShapeToDrawingContext } from '../lib/shape-context.utils'

describe('Layer.hitTest', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 1 })
	})

	it('returns topmost shape by zIndex', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas })

		const bottom = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red', zIndex: 0 }),
		)
		const top = baseShapeToDrawingContext(
			new CircleShape({ cx: 50, cy: 50, radius: 20, fillColor: 'blue', zIndex: 2 }),
		)

		layer.setShape(bottom)
		layer.setShape(top)

		const hit = layer.hitTest(50, 50)
		expect(hit?.shapeId).toBe(top.id)

		const miss = layer.hitTest(90, 90)
		expect(miss?.shapeId).toBe(bottom.id)
	})

	it('applies inverse transforms for hit-test', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas })

		const shape = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 20, height: 20, fillColor: 'red' }),
			{ transforms: [{ type: 'translate', translateX: 100, translateY: 50 }] },
		)
		layer.setShape(shape)

		expect(layer.hitTest(110, 60)?.shapeId).toBe(shape.id)
		expect(layer.hitTest(10, 10)).toBeUndefined()
	})

	it('respects clip-rect transforms', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas })

		const shape = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' }),
			{ transforms: [{ type: 'clip-rect', x: 0, y: 0, width: 30, height: 30 }] },
		)
		layer.setShape(shape)

		expect(layer.hitTest(10, 10)?.shapeId).toBe(shape.id)
		expect(layer.hitTest(50, 50)).toBeUndefined()
	})

	it('keeps zero-opacity shapes hittable', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas })

		const shape = baseShapeToDrawingContext(
			new RectShape({
				x: 0,
				y: 0,
				width: 40,
				height: 40,
				fillColor: 'red',
				opacity: 0,
			}),
		)
		layer.setShape(shape)

		expect(layer.hitTest(20, 20)?.shapeId).toBe(shape.id)
	})
})
