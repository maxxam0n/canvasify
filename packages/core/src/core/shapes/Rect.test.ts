import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { RectShape } from './Rect'

describe('RectShape', () => {
	it('draws fill and stroke when configured', () => {
		const { ctx, calls } = createMockContext()

		const shape = new RectShape({
			x: 5,
			y: 7,
			width: 10,
			height: 12,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 3,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'fillRect', args: [5, 7, 10, 12] },
			{ name: 'strokeRect', args: [5, 7, 10, 12] },
		])
		expect(shape.shapeParams).toEqual({ zIndex: 0, opacity: 1 })
		expect(shape.meta).toEqual({
			x: 5,
			y: 7,
			width: 10,
			height: 12,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 3,
		})
	})
})
