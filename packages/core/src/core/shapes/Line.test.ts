import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { LineShape } from './Line'

describe('LineShape', () => {
	it('skips draw when stroke is not configured', () => {
		const { ctx, calls } = createMockContext()

		const shape = new LineShape({ x1: 0, y1: 0, x2: 10, y2: 10 })
		shape.draw(ctx)

		expect(calls).toEqual([])
	})

	it('draws a line when stroke is set', () => {
		const { ctx, calls } = createMockContext()

		const shape = new LineShape({
			x1: 1,
			y1: 2,
			x2: 3,
			y2: 4,
			strokeColor: '#000',
			lineWidth: 2,
		})
		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'beginPath', args: [] },
			{ name: 'moveTo', args: [1, 2] },
			{ name: 'lineTo', args: [3, 4] },
			{ name: 'stroke', args: [] },
		])
	})
})
