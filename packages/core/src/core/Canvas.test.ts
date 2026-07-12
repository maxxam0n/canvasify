import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Layer } from './Layer'
import { createMockCanvas, createMockDocument } from '../__tests__/test.utils'
import { Canvas } from './Canvas'

describe('Canvas', () => {
	beforeEach(() => {
		vi.unstubAllGlobals()
	})

	it('schedules render once and can cancel', () => {
		const requestAnimationFrame = vi.fn(() => {
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
			zIndex: 0,
			render: vi.fn(),
		} as unknown as Layer

		const layerB = {
			name: 'b',
			canvas: layerCanvasB,
			opacity: 0.8,
			zIndex: 0,
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

	it('uses defaultBackground when export options omit background', () => {
		const exportCanvas = createMockCanvas()
		const documentStub = createMockDocument(() => exportCanvas)
		vi.stubGlobal('document', documentStub)

		const { canvas: layerCanvas } = createMockCanvas()
		layerCanvas.width = 100
		layerCanvas.height = 50

		const layer = {
			name: 'main',
			canvas: layerCanvas,
			opacity: 1,
			zIndex: 0,
			render: vi.fn(),
		} as unknown as Layer

		const canvas = new Canvas()
		canvas.setDefaultBackground('#abcdef')
		canvas.setLayer(layer)
		canvas.toDataURL()

		const fillCalls = exportCanvas.calls.filter(call => call.name === 'fillRect')
		expect(fillCalls).toHaveLength(1)
		expect(exportCanvas.ctx.fillStyle).toBe('#abcdef')
	})

	it('ignores transparent as defaultBackground', () => {
		const exportCanvas = createMockCanvas()
		const documentStub = createMockDocument(() => exportCanvas)
		vi.stubGlobal('document', documentStub)

		const { canvas: layerCanvas } = createMockCanvas()
		layerCanvas.width = 100
		layerCanvas.height = 50

		const layer = {
			name: 'main',
			canvas: layerCanvas,
			opacity: 1,
			zIndex: 0,
			render: vi.fn(),
		} as unknown as Layer

		const canvas = new Canvas()
		canvas.setDefaultBackground('transparent')
		canvas.setLayer(layer)
		canvas.toDataURL()

		const fillCalls = exportCanvas.calls.filter(call => call.name === 'fillRect')
		expect(fillCalls).toHaveLength(0)
	})

	it('hitTest prefers higher layer zIndex over registration order', () => {
		const bottomHit = {
			shapeId: 'bottom-shape',
			meta: {},
			zIndex: 0,
		}
		const topHit = {
			shapeId: 'top-shape',
			meta: {},
			zIndex: 1,
		}

		const earlyHigh = {
			name: 'early-high',
			opacity: 1,
			zIndex: 10,
			hitTest: vi.fn().mockReturnValue(topHit),
		} as unknown as Layer

		const lateLow = {
			name: 'late-low',
			opacity: 1,
			zIndex: 0,
			hitTest: vi.fn().mockReturnValue(bottomHit),
		} as unknown as Layer

		const canvas = new Canvas()
		canvas.setLayer(earlyHigh).setLayer(lateLow)

		const hit = canvas.hitTest(5, 5)
		expect(hit?.layerName).toBe('early-high')
		expect(hit?.shapeId).toBe('top-shape')
		expect(lateLow.hitTest).not.toHaveBeenCalled()
	})

	it('composes export layers by zIndex ascending', () => {
		const exportCanvas = createMockCanvas()
		const documentStub = createMockDocument(() => exportCanvas)
		vi.stubGlobal('document', documentStub)

		const { canvas: layerCanvasLow } = createMockCanvas()
		layerCanvasLow.width = 50
		layerCanvasLow.height = 50

		const { canvas: layerCanvasHigh } = createMockCanvas()
		layerCanvasHigh.width = 50
		layerCanvasHigh.height = 50

		const highFirst = {
			name: 'high',
			canvas: layerCanvasHigh,
			opacity: 1,
			zIndex: 5,
			render: vi.fn(),
		} as unknown as Layer

		const lowSecond = {
			name: 'low',
			canvas: layerCanvasLow,
			opacity: 1,
			zIndex: 1,
			render: vi.fn(),
		} as unknown as Layer

		const canvas = new Canvas()
		canvas.setLayer(highFirst).setLayer(lowSecond)
		canvas.toDataURL()

		const drawCalls = exportCanvas.calls.filter(call => call.name === 'drawImage')
		expect(drawCalls).toEqual([
			{ name: 'drawImage', args: [layerCanvasLow, 0, 0, 50, 50, 0, 0, 50, 50] },
			{ name: 'drawImage', args: [layerCanvasHigh, 0, 0, 50, 50, 0, 0, 50, 50] },
		])
	})

	it('throws or rejects when layer is missing', async () => {
		const canvas = new Canvas()

		expect(() => canvas.layerToDataURL('missing')).toThrow('layer "missing" not found')
		await expect(canvas.layerToBlob('missing')).rejects.toThrow('layer "missing" not found')
	})
})
