import { describe, expect, it } from 'vitest'

import {
	pointInCircle,
	pointInEllipse,
	pointInPolygon,
	pointInRect,
	distanceToSegment,
	getStrokeHitMode,
	hitTestCircle,
	hitTestEllipse,
	hitTestRect,
} from './hit-test.utils'

describe('hit-test.utils', () => {
	it('pointInRect', () => {
		expect(pointInRect(5, 5, { x: 0, y: 0, width: 10, height: 10 })).toBe(true)
		expect(pointInRect(11, 5, { x: 0, y: 0, width: 10, height: 10 })).toBe(false)
	})

	it('pointInCircle', () => {
		expect(pointInCircle(3, 4, 0, 0, 5)).toBe(true)
		expect(pointInCircle(4, 4, 0, 0, 5)).toBe(false)
	})

	it('pointInEllipse without rotation', () => {
		expect(pointInEllipse(5, 0, 0, 0, 10, 5)).toBe(true)
		expect(pointInEllipse(0, 6, 0, 0, 10, 5)).toBe(false)
	})

	it('pointInPolygon', () => {
		const square = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
		]
		expect(pointInPolygon(5, 5, square)).toBe(true)
		expect(pointInPolygon(15, 5, square)).toBe(false)
	})

	it('distanceToSegment', () => {
		expect(distanceToSegment(0, 1, 0, 0, 10, 0)).toBeCloseTo(1)
		expect(distanceToSegment(5, 0, 0, 0, 10, 0)).toBeCloseTo(0)
	})

	describe('stroke hit-test helpers', () => {
		const fillOnly = getStrokeHitMode('#f00', undefined, 1)
		const strokeOnly = getStrokeHitMode(undefined, '#000', 4, 0)
		const strokeWithPad = getStrokeHitMode(undefined, '#000', 4, 5)
		const both = getStrokeHitMode('#f00', '#000', 4, 0)

		it('hitTestCircle fill-only', () => {
			expect(hitTestCircle(0, 0, 0, 0, 10, fillOnly)).toBe(true)
			expect(hitTestCircle(10, 0, 0, 0, 10, fillOnly)).toBe(true)
			expect(hitTestCircle(11, 0, 0, 0, 10, fillOnly)).toBe(false)
		})

		it('hitTestCircle stroke-only does not hit interior', () => {
			expect(hitTestCircle(0, 0, 0, 0, 10, strokeOnly)).toBe(false)
			expect(hitTestCircle(10, 0, 0, 0, 10, strokeOnly)).toBe(true)
			expect(hitTestCircle(12, 0, 0, 0, 10, strokeOnly)).toBe(true)
			expect(hitTestCircle(13, 0, 0, 0, 10, strokeOnly)).toBe(false)
		})

		it('hitTestCircle stroke-only with hitStrokeWidth', () => {
			expect(hitTestCircle(15, 0, 0, 0, 10, strokeWithPad)).toBe(true)
			expect(hitTestCircle(17, 0, 0, 0, 10, strokeWithPad)).toBe(true)
			expect(hitTestCircle(18, 0, 0, 0, 10, strokeWithPad)).toBe(false)
		})

		it('hitTestCircle fill+stroke hits interior', () => {
			expect(hitTestCircle(0, 0, 0, 0, 10, both)).toBe(true)
			expect(hitTestCircle(12, 0, 0, 0, 10, both)).toBe(true)
		})

		it('hitTestEllipse stroke-only', () => {
			expect(hitTestEllipse(0, 0, 0, 0, 10, 5, 0, strokeOnly)).toBe(false)
			expect(hitTestEllipse(10, 0, 0, 0, 10, 5, 0, strokeOnly)).toBe(true)
		})

		it('hitTestRect stroke-only', () => {
			const rect = { x: 0, y: 0, width: 100, height: 100 }
			expect(hitTestRect(50, 50, rect, strokeOnly)).toBe(false)
			expect(hitTestRect(0, 50, rect, strokeOnly)).toBe(true)
			expect(hitTestRect(-1, 50, rect, strokeOnly)).toBe(true)
		})

		it('hitTestRect fill-only', () => {
			const rect = { x: 0, y: 0, width: 100, height: 100 }
			expect(hitTestRect(50, 50, rect, fillOnly)).toBe(true)
			expect(hitTestRect(101, 50, rect, fillOnly)).toBe(false)
		})
	})
})
