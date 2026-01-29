import { describe, expect, it } from 'vitest'

import { createMockContext } from '../__tests__/test.utils'
import { RectShape } from '../core/shapes/Rect'
import { baseShapeToDrawingContext, createShapeId } from './shape-context.utils'

describe('createShapeId', () => {
	it('returns unique string', () => {
		const id1 = createShapeId()
		const id2 = createShapeId()
		expect(typeof id1).toBe('string')
		expect(id1.length).toBeGreaterThan(0)
		expect(id1).not.toBe(id2)
	})
})

describe('baseShapeToDrawingContext', () => {
	it('creates ShapeDrawingContext from BaseShape without transforms', () => {
		const shape = new RectShape({
			x: 5,
			y: 7,
			width: 10,
			height: 12,
			fillColor: '#111',
			zIndex: 2,
			opacity: 0.8,
		})

		const ctx = baseShapeToDrawingContext(shape)

		expect(ctx.id).toBeDefined()
		expect(ctx.shapeParams).toEqual({ zIndex: 2, opacity: 0.8 })
		expect(ctx.meta).toEqual({
			x: 5,
			y: 7,
			width: 10,
			height: 12,
			fillColor: '#111',
			strokeColor: undefined,
			lineWidth: 1,
		})

		const { ctx: mockCtx, calls } = createMockContext()
		ctx.draw(mockCtx)
		expect(calls).toEqual([{ name: 'fillRect', args: [5, 7, 10, 12] }])

		calls.length = 0
		ctx.transform(mockCtx)
		expect(calls).toEqual([])
	})

	it('creates ShapeDrawingContext with custom id', () => {
		const shape = new RectShape({ width: 1, height: 1 })
		const ctx = baseShapeToDrawingContext(shape, { id: 'custom-id' })
		expect(ctx.id).toBe('custom-id')
	})

	it('creates ShapeDrawingContext with transforms', () => {
		const shape = new RectShape({ width: 1, height: 1 })
		const ctx = baseShapeToDrawingContext(shape, {
			transforms: [
				{ type: 'translate', translateX: 10, translateY: 20 },
				{ type: 'scale', scaleX: 2, scaleY: 3 },
			],
		})

		const { ctx: mockCtx, calls } = createMockContext()
		ctx.transform(mockCtx)

		expect(calls).toEqual([
			{ name: 'translate', args: [10, 20] },
			{ name: 'scale', args: [2, 3] },
		])
	})

	it('draw and transform work together', () => {
		const shape = new RectShape({ x: 0, y: 0, width: 50, height: 50, fillColor: 'blue' })
		const ctx = baseShapeToDrawingContext(shape, {
			transforms: [{ type: 'translate', translateX: 100, translateY: 50 }],
		})

		const { ctx: mockCtx, calls } = createMockContext()
		ctx.transform(mockCtx)
		ctx.draw(mockCtx)

		expect(calls).toEqual([
			{ name: 'translate', args: [100, 50] },
			{ name: 'fillRect', args: [0, 0, 50, 50] },
		])
	})
})
