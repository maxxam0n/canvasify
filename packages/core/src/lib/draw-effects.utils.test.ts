import { describe, expect, it } from 'vitest'

import {
	hasShadowEffects,
	inflateWorldBoundsForEffects,
	requiresFullDirtyForComposite,
} from './draw-effects.utils'

describe('draw-effects.utils', () => {
	it('detects shadow and composite dirty rules', () => {
		expect(hasShadowEffects({ shadowColor: 'rgba(0,0,0,0.5)' })).toBe(true)
		expect(hasShadowEffects({ shadowColor: 'transparent' })).toBe(false)
		expect(hasShadowEffects({ shadowBlur: 4 })).toBe(false)

		expect(requiresFullDirtyForComposite({})).toBe(false)
		expect(requiresFullDirtyForComposite({ globalCompositeOperation: 'source-over' })).toBe(false)
		expect(requiresFullDirtyForComposite({ globalCompositeOperation: 'multiply' })).toBe(true)
	})

	it('inflates bounds for shadow blur and offset', () => {
		const rect = { x: 10, y: 20, width: 30, height: 40 }

		expect(
			inflateWorldBoundsForEffects(rect, {
				shadowColor: 'black',
				shadowBlur: 5,
				shadowOffsetX: 3,
				shadowOffsetY: 4,
			}),
		).toEqual({
			x: 5,
			y: 15,
			width: 43,
			height: 54,
		})

		expect(inflateWorldBoundsForEffects(rect, { shadowColor: 'transparent' })).toEqual(rect)
	})
})
