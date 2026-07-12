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

	describe('contains', () => {
		it('fill-only hits interior', () => {
			const shape = new CircleShape({ radius: 10, fillColor: '#f00' })
			expect(shape.contains!(0, 0)).toBe(true)
			expect(shape.contains!(10, 0)).toBe(true)
			expect(shape.contains!(11, 0)).toBe(false)
		})

		it('stroke-only does not hit interior', () => {
			const shape = new CircleShape({ radius: 10, strokeColor: '#000', lineWidth: 4 })
			expect(shape.contains!(0, 0)).toBe(false)
			expect(shape.contains!(10, 0)).toBe(true)
		})

		it('fill+stroke hits interior', () => {
			const shape = new CircleShape({
				radius: 10,
				fillColor: '#f00',
				strokeColor: '#000',
				lineWidth: 4,
			})
			expect(shape.contains!(0, 0)).toBe(true)
			expect(shape.contains!(12, 0)).toBe(true)
		})

		it('hitStrokeWidth expands stroke hit area', () => {
			const shape = new CircleShape({
				radius: 10,
				strokeColor: '#000',
				lineWidth: 4,
				hitStrokeWidth: 5,
			})
			expect(shape.contains!(15, 0)).toBe(true)
			expect(shape.contains!(17, 0)).toBe(true)
			expect(shape.contains!(18, 0)).toBe(false)
		})
	})
})
