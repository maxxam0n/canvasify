import { describe, expect, it, vi } from 'vitest'

import { applyStrokeStyle } from './stroke-style'

describe('applyStrokeStyle', () => {
	it('applies line width and stroke style properties', () => {
		const setLineDash = vi.fn()
		const ctx = {
			lineWidth: 1,
			lineCap: 'butt' as CanvasLineCap,
			lineJoin: 'miter' as CanvasLineJoin,
			lineDashOffset: 0,
			setLineDash,
		} as unknown as CanvasRenderingContext2D

		applyStrokeStyle(ctx, {
			lineWidth: 4,
			lineCap: 'round',
			lineJoin: 'bevel',
			lineDash: [5, 3],
			lineDashOffset: 2,
		})

		expect(ctx.lineWidth).toBe(4)
		expect(ctx.lineCap).toBe('round')
		expect(ctx.lineJoin).toBe('bevel')
		expect(ctx.lineDashOffset).toBe(2)
		expect(setLineDash).toHaveBeenCalledWith([5, 3])
	})

	it('skips undefined properties', () => {
		const setLineDash = vi.fn()
		const ctx = {
			lineWidth: 2,
			lineCap: 'round' as CanvasLineCap,
			lineJoin: 'bevel' as CanvasLineJoin,
			lineDashOffset: 1,
			setLineDash,
		} as unknown as CanvasRenderingContext2D

		applyStrokeStyle(ctx, { lineWidth: 3 })

		expect(ctx.lineWidth).toBe(3)
		expect(ctx.lineCap).toBe('round')
		expect(ctx.lineJoin).toBe('bevel')
		expect(ctx.lineDashOffset).toBe(1)
		expect(setLineDash).not.toHaveBeenCalled()
	})
})
