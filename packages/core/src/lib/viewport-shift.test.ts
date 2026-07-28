import { describe, expect, it } from 'vitest'

import { createViewportShiftPlan, resolvePhysicalViewportShift } from './viewport-shift'

describe('createViewportShiftPlan', () => {
	it('returns the overlap and one exposed strip for horizontal movement', () => {
		expect(
			createViewportShiftPlan(
				{ x: 0, y: 0, width: 300, height: 200 },
				{ x: 100, y: 0, width: 300, height: 200 },
			),
		).toEqual({
			offset: { x: -100, y: 0 },
			overlap: { x: 100, y: 0, width: 200, height: 200 },
			exposedRegions: [{ x: 300, y: 0, width: 100, height: 200 }],
		})
	})

	it('splits a diagonal movement into non-overlapping exposed strips', () => {
		expect(
			createViewportShiftPlan(
				{ x: 0, y: 0, width: 300, height: 200 },
				{ x: 100, y: 50, width: 300, height: 200 },
			),
		).toEqual({
			offset: { x: -100, y: -50 },
			overlap: { x: 100, y: 50, width: 200, height: 150 },
			exposedRegions: [
				{ x: 100, y: 200, width: 300, height: 50 },
				{ x: 300, y: 50, width: 100, height: 150 },
			],
		})
	})

	it('falls back when dimensions change or viewports do not overlap', () => {
		expect(
			createViewportShiftPlan(
				{ x: 0, y: 0, width: 300, height: 200 },
				{ x: 0, y: 0, width: 400, height: 200 },
			),
		).toBeNull()
		expect(
			createViewportShiftPlan(
				{ x: 0, y: 0, width: 300, height: 200 },
				{ x: 300, y: 0, width: 300, height: 200 },
			),
		).toBeNull()
	})

	it('accepts only shifts aligned to the physical bitmap grid', () => {
		const plan = createViewportShiftPlan(
			{ x: 0, y: 0, width: 1_792, height: 1_536 },
			{ x: 256, y: 0, width: 1_792, height: 1_536 },
		)

		expect(plan).not.toBeNull()
		if (!plan) return

		expect(
			resolvePhysicalViewportShift(
				plan,
				{ width: 1_528, height: 1_309 },
				{ x: 256, y: 0, width: 1_792, height: 1_536 },
			),
		).toBeNull()

		const alignedOffset = 218 / (1_528 / 1_792)
		const alignedPlan = createViewportShiftPlan(
			{ x: 0, y: 0, width: 1_792, height: 1_536 },
			{ x: alignedOffset, y: 0, width: 1_792, height: 1_536 },
		)

		expect(alignedPlan).not.toBeNull()
		if (!alignedPlan) return
		expect(
			resolvePhysicalViewportShift(
				alignedPlan,
				{ width: 1_528, height: 1_309 },
				{ x: alignedOffset, y: 0, width: 1_792, height: 1_536 },
			),
		).toEqual({ x: -218, y: 0 })
	})
})
