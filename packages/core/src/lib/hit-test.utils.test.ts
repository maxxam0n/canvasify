import { describe, expect, it } from 'vitest'

import {
	pointInCircle,
	pointInEllipse,
	pointInPolygon,
	pointInRect,
	distanceToSegment,
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
})
