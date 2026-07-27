import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Layer } from './Layer'
import { createMockCanvas, createMockDocument } from '../__tests__/test.utils'
import { Canvas } from './Canvas'

const createLayerStub = ({
	name,
	width,
	height,
	zIndex = 0,
}: {
	name: string
	width: number
	height: number
	zIndex?: number
}) =>
	({
		name,
		opacity: 1,
		zIndex,
		getSize: vi.fn(() => ({ width, height })),
		getPixelRatio: vi.fn(() => 1),
		renderToContext: vi.fn(),
	}) as unknown as Layer

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

		const layerA = createLayerStub({ name: 'a', width: 200, height: 100 })
		const layerB = createLayerStub({ name: 'b', width: 100, height: 300 })

		const canvas = new Canvas()
		canvas.setLayer(layerA).setLayer(layerB)
		canvas.toDataURL({ maxSize: 100, background: '#fff', imageSmoothingEnabled: false })

		expect(exportCanvas.canvas.width).toBe(67)
		expect(exportCanvas.canvas.height).toBe(100)
		expect(exportCanvas.ctx.imageSmoothingEnabled).toBe(false)
		expect(layerA.renderToContext).toHaveBeenCalledWith(exportCanvas.ctx, {
			width: 67,
			height: 100,
			sceneWidth: 200,
			sceneHeight: 300,
		})
		expect(layerB.renderToContext).toHaveBeenCalledWith(exportCanvas.ctx, {
			width: 67,
			height: 100,
			sceneWidth: 200,
			sceneHeight: 300,
		})
	})

	it('uses defaultBackground when export options omit background', () => {
		const exportCanvas = createMockCanvas()
		const documentStub = createMockDocument(() => exportCanvas)
		vi.stubGlobal('document', documentStub)

		const layer = createLayerStub({ name: 'main', width: 100, height: 50 })

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

		const layer = createLayerStub({ name: 'main', width: 100, height: 50 })

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

		const callOrder: string[] = []
		const highFirst = createLayerStub({
			name: 'high',
			width: 50,
			height: 50,
			zIndex: 5,
		})
		const lowSecond = createLayerStub({
			name: 'low',
			width: 50,
			height: 50,
			zIndex: 1,
		})
		vi.mocked(highFirst.renderToContext).mockImplementation(() => callOrder.push('high'))
		vi.mocked(lowSecond.renderToContext).mockImplementation(() => callOrder.push('low'))

		const canvas = new Canvas()
		canvas.setLayer(highFirst).setLayer(lowSecond)
		canvas.toDataURL()

		expect(callOrder).toEqual(['low', 'high'])
	})

	it('throws or rejects when layer is missing', async () => {
		const canvas = new Canvas()

		expect(() => canvas.layerToDataURL('missing')).toThrow('layer "missing" not found')
		await expect(canvas.layerToBlob('missing')).rejects.toThrow('layer "missing" not found')
	})
})
