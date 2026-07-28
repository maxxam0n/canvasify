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

	describe('contains', () => {
		it('fill-only hits interior', () => {
			const shape = new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: '#f00' })
			expect(shape.contains!(50, 50)).toBe(true)
			expect(shape.contains!(101, 50)).toBe(false)
		})

		it('stroke-only does not hit interior', () => {
			const shape = new RectShape({
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				strokeColor: '#000',
				lineWidth: 4,
			})
			expect(shape.contains!(50, 50)).toBe(false)
			expect(shape.contains!(0, 50)).toBe(true)
		})

		it('hitStrokeWidth expands stroke hit', () => {
			const shape = new RectShape({
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				strokeColor: '#000',
				lineWidth: 4,
				hitStrokeWidth: 5,
			})
			expect(shape.contains!(-6, 50)).toBe(true)
		})
	})
})
