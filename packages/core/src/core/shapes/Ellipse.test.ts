import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { EllipseShape } from './Ellipse'

describe('EllipseShape', () => {
	it('draws ellipse with fill and stroke', () => {
		const { ctx, calls } = createMockContext()

		const shape = new EllipseShape({
			cx: 10,
			cy: 20,
			radiusX: 5,
			radiusY: 6,
			rotation: 0.5,
			fillColor: '#abc',
			strokeColor: '#def',
			lineWidth: 2,
			opacity: 0.8,
			zIndex: 3,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'beginPath', args: [] },
			{ name: 'ellipse', args: [10, 20, 5, 6, 0.5, 0, Math.PI * 2] },
			{ name: 'fill', args: [] },
			{ name: 'stroke', args: [] },
		])
		expect(shape.shapeParams).toEqual({ zIndex: 3, opacity: 0.8 })
		expect(shape.meta).toEqual({
			radiusX: 5,
			radiusY: 6,
			cx: 10,
			cy: 20,
			rotation: 0.5,
			fillColor: '#abc',
			strokeColor: '#def',
			lineWidth: 2,
		})
	})

	it('does not fill when fillColor is omitted', () => {
		const { ctx, calls } = createMockContext()

		const shape = new EllipseShape({
			radiusX: 5,
			radiusY: 6,
			strokeColor: '#111',
		})

		shape.draw(ctx)

		expect(calls.map(call => call.name)).toEqual(['beginPath', 'ellipse', 'stroke'])
		expect(shape.meta.fillColor).toBeUndefined()
	})

	describe('contains', () => {
		it('stroke-only does not hit interior', () => {
			const shape = new EllipseShape({
				radiusX: 10,
				radiusY: 5,
				strokeColor: '#000',
				lineWidth: 4,
			})
			expect(shape.contains!(0, 0)).toBe(false)
			expect(shape.contains!(10, 0)).toBe(true)
		})

		it('fill+stroke hits interior', () => {
			const shape = new EllipseShape({
				radiusX: 10,
				radiusY: 5,
				fillColor: '#f00',
				strokeColor: '#000',
				lineWidth: 4,
			})
			expect(shape.contains!(0, 0)).toBe(true)
		})
	})
})
