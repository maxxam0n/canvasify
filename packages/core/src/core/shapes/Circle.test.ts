import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { CircleShape } from './Circle'

describe('CircleShape', () => {
	it('draws circle with fill and stroke', () => {
		const { ctx, calls } = createMockContext()

		const shape = new CircleShape({
			cx: 3,
			cy: 4,
			radius: 5,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 2,
			opacity: 0.7,
			zIndex: 2,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'beginPath', args: [] },
			{ name: 'arc', args: [3, 4, 5, 0, Math.PI * 2] },
			{ name: 'fill', args: [] },
			{ name: 'stroke', args: [] },
		])
		expect(shape.shapeParams).toEqual({ zIndex: 2, opacity: 0.7 })
		expect(shape.meta).toEqual({
			radius: 5,
			cx: 3,
			cy: 4,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 2,
		})
	})
})
