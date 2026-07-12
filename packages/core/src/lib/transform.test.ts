import { describe, expect, it } from 'vitest'

import { invertPointThroughTransforms } from './transform'
import type { Transform } from '../model/transform.types'
import type { Point } from '../model/types'

const applyGeometricForward = (point: Point, transforms: Transform[]): Point => {
	let { x, y } = point

	// Как transformRectToWorld / canvas CTM = T0·…·Tn: к точке сначала Tn, затем …, T0.
	for (let i = transforms.length - 1; i >= 0; i--) {
		const transform = transforms[i]
		if (transform.type === 'clip-rect') continue

		switch (transform.type) {
			case 'translate': {
				x += transform.translateX
				y += transform.translateY
				break
			}
			case 'scale': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0
				x = originX + (x - originX) * transform.scaleX
				y = originY + (y - originY) * transform.scaleY
				break
			}
			case 'rotation': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0
				const cos = Math.cos(transform.angle)
				const sin = Math.sin(transform.angle)
				const dx = x - originX
				const dy = y - originY
				x = dx * cos - dy * sin + originX
				y = dx * sin + dy * cos + originY
				break
			}
			case 'skew': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0
				const tanX = Math.tan(transform.skewX)
				const tanY = Math.tan(transform.skewY)
				const dx = x - originX
				const dy = y - originY
				x = dx + tanX * dy + originX
				y = tanY * dx + dy + originY
				break
			}
			case 'matrix': {
				const nx = transform.a * x + transform.c * y + transform.e
				const ny = transform.b * x + transform.d * y + transform.f
				x = nx
				y = ny
				break
			}
		}
	}

	return { x, y }
}

const expectRoundTrip = (local: Point, transforms: Transform[]) => {
	const world = applyGeometricForward(local, transforms)
	const inverted = invertPointThroughTransforms(world, transforms)
	expect(inverted).toBeDefined()
	expect(inverted!.x).toBeCloseTo(local.x)
	expect(inverted!.y).toBeCloseTo(local.y)
}

describe('invertPointThroughTransforms', () => {
	it('inverts translate', () => {
		const transforms: Transform[] = [{ type: 'translate', translateX: 10, translateY: 20 }]
		expect(invertPointThroughTransforms({ x: 15, y: 25 }, transforms)).toEqual({ x: 5, y: 5 })
	})

	it('rejects points outside clip-rect', () => {
		const transforms: Transform[] = [
			{ type: 'clip-rect', x: 0, y: 0, width: 10, height: 10 },
		]
		expect(invertPointThroughTransforms({ x: 5, y: 5 }, transforms)).toEqual({ x: 5, y: 5 })
		expect(invertPointThroughTransforms({ x: 15, y: 5 }, transforms)).toBeNull()
	})

	it('inverts translate then respects clip in local space', () => {
		const transforms: Transform[] = [
			{ type: 'translate', translateX: 100, translateY: 0 },
			{ type: 'clip-rect', x: 0, y: 0, width: 50, height: 50 },
		]
		// world (120, 10) -> after inverse clip check in translated space (20, 10) -> then -translate
		expect(invertPointThroughTransforms({ x: 120, y: 10 }, transforms)).toEqual({ x: 20, y: 10 })
		expect(invertPointThroughTransforms({ x: 160, y: 10 }, transforms)).toBeNull()
	})

	it('round-trips skew without origin', () => {
		const transforms: Transform[] = [{ type: 'skew', skewX: 0.35, skewY: -0.2 }]
		expectRoundTrip({ x: 4, y: 7 }, transforms)
		expectRoundTrip({ x: -3, y: 12 }, transforms)
	})

	it('round-trips skew with origin', () => {
		const transforms: Transform[] = [
			{ type: 'skew', skewX: 0.25, skewY: 0.15, originX: 10, originY: 20 },
		]
		expectRoundTrip({ x: 14, y: 28 }, transforms)
	})

	it('round-trips matrix', () => {
		const transforms: Transform[] = [
			{ type: 'matrix', a: 2, b: 0.5, c: -0.3, d: 1.5, e: 40, f: -10 },
		]
		expectRoundTrip({ x: 3, y: 8 }, transforms)
	})

	it('round-trips skew and matrix combined', () => {
		const transforms: Transform[] = [
			{ type: 'translate', translateX: 5, translateY: -3 },
			{ type: 'skew', skewX: 0.1, skewY: 0.05 },
			{ type: 'matrix', a: 1.2, b: 0, c: 0, d: 0.8, e: 0, f: 0 },
		]
		expectRoundTrip({ x: 11, y: 6 }, transforms)
	})

	it('handles singular matrix via epsilon determinant', () => {
		const transforms: Transform[] = [
			{ type: 'matrix', a: 1, b: 2, c: 2, d: 4, e: 0, f: 0 },
		]
		const result = invertPointThroughTransforms({ x: 4, y: 6 }, transforms)
		expect(result).toBeDefined()
		expect(Number.isFinite(result!.x)).toBe(true)
		expect(Number.isFinite(result!.y)).toBe(true)
	})
})
