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

	it('applies composite and shadow before transform and draw', () => {
		const { ctx } = createMockContext()
		const effectState: Array<{
			globalAlpha: number
			composite: GlobalCompositeOperation
			shadowColor: string
			shadowBlur: number
		}> = []

		const shape: ShapeDrawingContext = {
			id: 'fx',
			shapeParams: { zIndex: 0, opacity: 0.5 },
			meta: {},
			globalCompositeOperation: 'multiply',
			shadowColor: 'rgba(0,0,0,0.4)',
			shadowBlur: 6,
			shadowOffsetX: 2,
			shadowOffsetY: 3,
			transform: c => {
				effectState.push({
					globalAlpha: c.globalAlpha,
					composite: c.globalCompositeOperation,
					shadowColor: c.shadowColor,
					shadowBlur: c.shadowBlur,
				})
			},
			draw: () => undefined,
		}

		renderShapes(ctx, [shape])

		expect(effectState).toEqual([
			{
				globalAlpha: 0.5,
				composite: 'multiply',
				shadowColor: 'rgba(0,0,0,0.4)',
				shadowBlur: 6,
			},
		])
		expect(ctx.shadowOffsetX).toBe(2)
		expect(ctx.shadowOffsetY).toBe(3)
	})
})
