import { describe, expect, it, vi } from 'vitest'

import { resolvePaint } from './paint'

const createGradientMock = () => ({
	addColorStop: vi.fn(),
})

describe('resolvePaint', () => {
	it('returns string paint as-is', () => {
		const ctx = {} as CanvasRenderingContext2D

		expect(resolvePaint(ctx, '#ff0000')).toBe('#ff0000')
	})

	it('resolves linear gradient', () => {
		const gradient = createGradientMock()
		const createLinearGradient = vi.fn(() => gradient)
		const ctx = { createLinearGradient } as unknown as CanvasRenderingContext2D

		const result = resolvePaint(ctx, {
			type: 'linear-gradient',
			x0: 0,
			y0: 0,
			x1: 10,
			y1: 10,
			stops: [
				{ offset: 0, color: 'red' },
				{ offset: 1, color: 'blue' },
			],
		})

		expect(createLinearGradient).toHaveBeenCalledWith(0, 0, 10, 10)
		expect(gradient.addColorStop).toHaveBeenCalledWith(0, 'red')
		expect(gradient.addColorStop).toHaveBeenCalledWith(1, 'blue')
		expect(result).toBe(gradient)
	})

	it('resolves radial gradient', () => {
		const gradient = createGradientMock()
		const createRadialGradient = vi.fn(() => gradient)
		const ctx = { createRadialGradient } as unknown as CanvasRenderingContext2D

		const result = resolvePaint(ctx, {
			type: 'radial-gradient',
			x0: 5,
			y0: 5,
			r0: 0,
			x1: 5,
			y1: 5,
			r1: 10,
			stops: [{ offset: 0, color: 'white' }],
		})

		expect(createRadialGradient).toHaveBeenCalledWith(5, 5, 0, 5, 5, 10)
		expect(gradient.addColorStop).toHaveBeenCalledWith(0, 'white')
		expect(result).toBe(gradient)
	})

	it('resolves pattern with default repetition', () => {
		const image = {} as CanvasImageSource
		const pattern = {} as CanvasPattern
		const createPattern = vi.fn(() => pattern)
		const ctx = { createPattern } as unknown as CanvasRenderingContext2D

		const result = resolvePaint(ctx, { type: 'pattern', image })

		expect(createPattern).toHaveBeenCalledWith(image, 'repeat')
		expect(result).toBe(pattern)
	})

	it('resolves pattern with custom repetition', () => {
		const image = {} as CanvasImageSource
		const pattern = {} as CanvasPattern
		const createPattern = vi.fn(() => pattern)
		const ctx = { createPattern } as unknown as CanvasRenderingContext2D

		const result = resolvePaint(ctx, {
			type: 'pattern',
			image,
			repetition: 'no-repeat',
		})

		expect(createPattern).toHaveBeenCalledWith(image, 'no-repeat')
		expect(result).toBe(pattern)
	})

	it('returns transparent when createPattern returns null', () => {
		const image = {} as CanvasImageSource
		const createPattern = vi.fn(() => null)
		const ctx = { createPattern } as unknown as CanvasRenderingContext2D

		expect(resolvePaint(ctx, { type: 'pattern', image })).toBe('transparent')
	})
})
