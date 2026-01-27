import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Layer } from './Layer'
import { createMockCanvas, createMockDocument } from '../__tests__/test.utils'
import { Canvas } from './Canvas'

describe('Canvas', () => {
	beforeEach(() => {
		vi.unstubAllGlobals()
	})

	it('schedules render once and can cancel', () => {
		const requestAnimationFrame = vi.fn((_callback: FrameRequestCallback) => {
			return 42
		})
		const cancelAnimationFrame = vi.fn()

		vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
		vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame)

		const canvas = new Canvas()
		canvas.requestRender()
		canvas.requestRender()
		canvas.cancelRender()
		canvas.requestRender()

		expect(requestAnimationFrame).toHaveBeenCalledTimes(2)
		expect(cancelAnimationFrame).toHaveBeenCalledWith(42)
	})

	it('throws when exporting without layers', () => {
		const canvas = new Canvas()

		expect(() => canvas.toDataURL()).toThrow('no layers registered')
	})

	it('composes layers into export canvas', () => {
		const exportCanvas = createMockCanvas()
		const documentStub = createMockDocument(() => exportCanvas)
		vi.stubGlobal('document', documentStub)

		const { canvas: layerCanvasA } = createMockCanvas()
		layerCanvasA.width = 200
		layerCanvasA.height = 100

		const { canvas: layerCanvasB } = createMockCanvas()
		layerCanvasB.width = 100
		layerCanvasB.height = 300

		const layerA = {
			name: 'a',
			canvas: layerCanvasA,
			opacity: 0.5,
			render: vi.fn(),
		} as unknown as Layer

		const layerB = {
			name: 'b',
			canvas: layerCanvasB,
			opacity: 0.8,
			render: vi.fn(),
		} as unknown as Layer

		const canvas = new Canvas()
		canvas.setLayer(layerA).setLayer(layerB)
		canvas.toDataURL({ maxSize: 100, background: '#fff', imageSmoothingEnabled: false })

		const drawCalls = exportCanvas.calls.filter(call => call.name === 'drawImage')
		expect(exportCanvas.canvas.width).toBe(67)
		expect(exportCanvas.canvas.height).toBe(100)
		expect(exportCanvas.ctx.imageSmoothingEnabled).toBe(false)
		expect(drawCalls).toEqual([
			{ name: 'drawImage', args: [layerCanvasA, 0, 0, 200, 300, 0, 0, 67, 100] },
			{ name: 'drawImage', args: [layerCanvasB, 0, 0, 200, 300, 0, 0, 67, 100] },
		])
	})

	it('throws or rejects when layer is missing', async () => {
		const canvas = new Canvas()

		expect(() => canvas.layerToDataURL('missing')).toThrow('layer "missing" not found')
		await expect(canvas.layerToBlob('missing')).rejects.toThrow('layer "missing" not found')
	})
})
