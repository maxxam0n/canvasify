import { describe, expect, it } from 'vitest'

import { invertPointThroughTransforms } from './transform'
import type { Transform } from '../model/transform.types'

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
})
