import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockCanvas, createMockContext, createMockDocument } from '../__tests__/test.utils'
import { createCacheSurface } from './offscreen-canvas.utils'

describe('offscreen-canvas.utils', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('falls back to HTMLCanvasElement when OffscreenCanvas is unavailable', () => {
		vi.stubGlobal('OffscreenCanvas', undefined)

		const { ctx: cacheCtx } = createMockContext()
		const cacheCanvas = createMockCanvas(cacheCtx).canvas
		vi.stubGlobal(
			'document',
			createMockDocument(() => ({ canvas: cacheCanvas, ctx: cacheCtx, calls: [] })),
		)

		const surface = createCacheSurface(40, 20)

		expect(surface.canvas).toBe(cacheCanvas)
		expect(surface.ctx).toBe(cacheCtx)
		expect(cacheCanvas.width).toBe(40)
		expect(cacheCanvas.height).toBe(20)
	})

	it('prefers OffscreenCanvas when the constructor exists', () => {
		const { ctx: offscreenCtx } = createMockContext()
		const offscreenCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => offscreenCtx),
		}

		const OffscreenCanvasMock = vi.fn(function OffscreenCanvasMock(
			this: typeof offscreenCanvas,
			width: number,
			height: number,
		) {
			offscreenCanvas.width = width
			offscreenCanvas.height = height
			return offscreenCanvas
		})

		vi.stubGlobal('OffscreenCanvas', OffscreenCanvasMock)
		const createElement = vi.fn()
		vi.stubGlobal('document', { createElement })

		const surface = createCacheSurface(80, 60)

		expect(OffscreenCanvasMock).toHaveBeenCalledWith(80, 60)
		expect(createElement).not.toHaveBeenCalled()
		expect(surface.canvas).toBe(offscreenCanvas)
		expect(surface.ctx).toBe(offscreenCtx)
	})
})
