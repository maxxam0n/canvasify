import { describe, expect, it } from 'vitest'

import {
	arcEndPoint,
	arcStartPoint,
	cubicBezierPoint,
	distanceToPolyline,
	normalizeArcSweep,
	quadraticBezierPoint,
	sampleArc,
	sampleCubicBezier,
} from './path-geometry.utils'

describe('path-geometry.utils', () => {
	it('cubicBezierPoint совпадает с конечными точками при t=0 и t=1', () => {
		expect(cubicBezierPoint(0, 0, 10, 20, 30, 40, 100, 0, 0)).toEqual({ x: 0, y: 0 })
		expect(cubicBezierPoint(0, 0, 10, 20, 30, 40, 100, 0, 1)).toEqual({ x: 100, y: 0 })
	})

	it('quadraticBezierPoint совпадает с конечными точками при t=0 и t=1', () => {
		expect(quadraticBezierPoint(0, 0, 50, 100, 100, 0, 0)).toEqual({ x: 0, y: 0 })
		expect(quadraticBezierPoint(0, 0, 50, 100, 100, 0, 1)).toEqual({ x: 100, y: 0 })
	})

	it('sampleCubicBezier включает конечную точку', () => {
		const samples = sampleCubicBezier(0, 0, 0, 100, 100, 100, 100, 0, 4)
		expect(samples.at(-1)).toEqual({ x: 100, y: 0 })
		expect(samples).toHaveLength(4)
	})

	it('normalizeArcSweep разворачивает угол по часовой стрелке', () => {
		expect(normalizeArcSweep(0, -Math.PI / 2, false)).toEqual({
			start: 0,
			end: (3 * Math.PI) / 2,
		})
	})

	it('sampleArc аппроксимирует четверть окружности', () => {
		const samples = sampleArc(0, 0, 10, 0, Math.PI / 2, false, 4)
		const start = arcStartPoint(0, 0, 10, 0)
		const end = arcEndPoint(0, 0, 10, 0, Math.PI / 2, false)
		const firstAngle = Math.PI / 8

		expect(start.x).toBeCloseTo(10)
		expect(start.y).toBeCloseTo(0)
		expect(end.x).toBeCloseTo(0)
		expect(end.y).toBeCloseTo(10)
		expect(samples[0].x).toBeCloseTo(10 * Math.cos(firstAngle))
		expect(samples[0].y).toBeCloseTo(10 * Math.sin(firstAngle))
		expect(samples.at(-1)?.x).toBeCloseTo(end.x)
		expect(samples.at(-1)?.y).toBeCloseTo(end.y)
	})

	it('distanceToPolyline измеряет расстояние до ломаной', () => {
		const polyline = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
		]
		expect(distanceToPolyline(5, 3, polyline)).toBeCloseTo(3)
		expect(distanceToPolyline(5, 0, polyline)).toBeCloseTo(0)
	})
})
