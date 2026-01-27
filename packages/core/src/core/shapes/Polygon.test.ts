import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { PolygonShape } from './Polygon'

describe('PolygonShape', () => {
	it('skips draw when not enough points', () => {
		const { ctx, calls } = createMockContext()

		const shape = new PolygonShape({ points: [{ x: 1, y: 2 }], strokeColor: '#000' })
		shape.draw(ctx)

		expect(calls).toEqual([])
	})

	it('draws closed polygon with fill and stroke', () => {
		const { ctx, calls } = createMockContext()

		const shape = new PolygonShape({
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 2,
			opacity: 0.5,
			zIndex: 4,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'beginPath', args: [] },
			{ name: 'moveTo', args: [0, 0] },
			{ name: 'lineTo', args: [10, 0] },
			{ name: 'lineTo', args: [10, 10] },
			{ name: 'closePath', args: [] },
			{ name: 'fill', args: [] },
			{ name: 'stroke', args: [] },
		])
		expect(shape.shapeParams).toEqual({ zIndex: 4, opacity: 0.5 })
	})
})
