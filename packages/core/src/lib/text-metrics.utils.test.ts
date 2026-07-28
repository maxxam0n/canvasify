import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../__tests__/test.utils'
import {
	getTextLineYs,
	layoutTextLines,
	measureTextBounds,
	resetTextMeasureContext,
} from './text-metrics.utils'

describe('layoutTextLines', () => {
	afterEach(() => {
		resetTextMeasureContext()
		vi.unstubAllGlobals()
	})

	it('splits hard breaks on \\n without wrap', () => {
		const layout = layoutTextLines({
			text: 'one\ntwo',
			font: '16px sans-serif',
			fallbackFontSize: 16,
		})

		expect(layout.lines).toEqual(['one', 'two'])
		expect(layout.lineHeight).toBeCloseTo(19.2)
		expect(layout.height).toBeCloseTo(38.4)
	})

	it('wraps words when wrap=true and maxWidth is set', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
		})

		const layout = layoutTextLines({
			text: 'hello world',
			font: '16px sans-serif',
			wrap: true,
			maxWidth: 70,
			fallbackFontSize: 16,
		})

		expect(layout.lines).toEqual(['hello', 'world'])
		expect(layout.width).toBe(50)
	})

	it('keeps squeeze width without wrap and maxWidth', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
		})

		const layout = layoutTextLines({
			text: 'hello',
			font: '16px sans-serif',
			maxWidth: 25,
			fallbackFontSize: 16,
		})

		expect(layout.lines).toEqual(['hello'])
		expect(layout.width).toBe(25)
	})
})

describe('getTextLineYs', () => {
	it('places additional lines below alphabetic anchor', () => {
		expect(getTextLineYs(20, 2, 18, 'alphabetic')).toEqual([20, 38])
	})

	it('centers block around middle baseline', () => {
		expect(getTextLineYs(50, 2, 20, 'middle')).toEqual([40, 60])
	})
})

describe('measureTextBounds', () => {
	afterEach(() => {
		resetTextMeasureContext()
		vi.unstubAllGlobals()
	})

	it('uses measureText actualBoundingBox when available', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
		})

		const bounds = measureTextBounds({
			text: 'hi',
			font: '16px sans-serif',
			x: 10,
			y: 20,
			textAlign: 'left',
			textBaseline: 'alphabetic',
		})

		// mock: left=0, right=20, ascent=12, descent=4 → [10, 8, 20, 16]
		expect(bounds).toEqual({ x: 10, y: 8, width: 20, height: 16 })
		expect(ctx.measureText).toHaveBeenCalledWith('hi')
	})

	it('falls back to font-size estimate without document', () => {
		vi.stubGlobal('document', undefined)

		const bounds = measureTextBounds({
			text: 'ab',
			font: '20px sans-serif',
			x: 0,
			y: 20,
			textAlign: 'left',
			textBaseline: 'alphabetic',
			fallbackFontSize: 20,
		})

		// width = max(20*0.6*2, 20) = 24; height = 24; top ≈ 20 - 19.2
		expect(bounds.width).toBe(24)
		expect(bounds.height).toBe(24)
		expect(bounds.x).toBe(0)
		expect(bounds.y).toBeCloseTo(20 - 24 * 0.8)
	})

	it('respects center align and maxWidth squeeze', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
		})

		const bounds = measureTextBounds({
			text: 'hello', // width 50 in mock
			font: '16px sans-serif',
			x: 100,
			y: 50,
			textAlign: 'center',
			textBaseline: 'middle',
			maxWidth: 25,
		})

		// scaleX = 0.5; left = 100 - 0*0.5, right = 100 + 50*0.5
		expect(bounds.x).toBe(100)
		expect(bounds.width).toBe(25)
	})

	it('unions bounds for multi-line hard breaks', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
		})

		const bounds = measureTextBounds({
			text: 'hi\nthere',
			font: '16px sans-serif',
			x: 10,
			y: 20,
			textAlign: 'left',
			textBaseline: 'alphabetic',
			lineHeight: 16,
		})

		expect(bounds.x).toBe(10)
		expect(bounds.y).toBe(8)
		expect(bounds.width).toBe(50)
		expect(bounds.height).toBe(32)
	})
})
