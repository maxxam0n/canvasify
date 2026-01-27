import { describe, expect, it } from 'vitest'

import type { ShapeDrawingContext } from '../model/shape.types'
import { createMockContext } from '../__tests__/test.utils'
import { renderShapes } from './render'

describe('renderShapes', () => {
	it('renders shapes in zIndex order with opacity', () => {
		const { ctx, calls } = createMockContext()
		const drawCalls: string[] = []

		const makeShape = (id: string, zIndex: number, opacity: number): ShapeDrawingContext => ({
			id,
			shapeParams: { zIndex, opacity },
			meta: {},
			transform: () => {
				drawCalls.push(`${id}:transform`)
			},
			draw: () => {
				drawCalls.push(`${id}:draw`)
			},
		})

		const shapeA = makeShape('a', 2, 0.4)
		const shapeB = makeShape('b', 1, 0.9)

		renderShapes(ctx, [shapeA, shapeB])

		expect(drawCalls).toEqual(['b:transform', 'b:draw', 'a:transform', 'a:draw'])
		expect(calls.filter(c => c.name === 'save')).toHaveLength(2)
		expect(calls.filter(c => c.name === 'restore')).toHaveLength(2)
		expect(ctx.globalAlpha).toBe(0.4)
	})
})
