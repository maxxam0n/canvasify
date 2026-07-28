import { describe, expect, it } from 'vitest'

import { inflateRect, transformRectToWorld, unionRects } from './rect.utils'

describe('rect.utils', () => {
	it('unions and inflates rects', () => {
		expect(
			unionRects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
		).toEqual({
			x: 0,
			y: 0,
			width: 15,
			height: 15,
		})
		expect(inflateRect({ x: 10, y: 10, width: 20, height: 20 }, 2)).toEqual({
			x: 8,
			y: 8,
			width: 24,
			height: 24,
		})
	})

	it('transforms local bounds through translate and scale', () => {
		// CTM = T * S → local (0,0)-(10,10) → world (100,50)-(120,70)
		const world = transformRectToWorld({ x: 0, y: 0, width: 10, height: 10 }, [
			{ type: 'translate', translateX: 100, translateY: 50 },
			{ type: 'scale', scaleX: 2, scaleY: 2 },
		])

		expect(world).toEqual({ x: 100, y: 50, width: 20, height: 20 })
	})

	it('transforms local bounds through skew', () => {
		const skewX = Math.PI / 6
		const tanX = Math.tan(skewX)
		const world = transformRectToWorld({ x: 0, y: 0, width: 10, height: 10 }, [
			{ type: 'skew', skewX, skewY: 0 },
		])

		expect(world).toEqual({
			x: 0,
			y: 0,
			width: 10 + tanX * 10,
			height: 10,
		})
	})

	it('transforms local bounds through matrix', () => {
		const world = transformRectToWorld({ x: 0, y: 0, width: 10, height: 10 }, [
			{ type: 'matrix', a: 2, b: 0, c: 0, d: 3, e: 5, f: 7 },
		])

		expect(world).toEqual({ x: 5, y: 7, width: 20, height: 30 })
	})
})
