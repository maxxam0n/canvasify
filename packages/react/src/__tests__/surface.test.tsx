/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
import type { RenderLayer } from '@maxxam0n/canvasify-core'

import { Canvas, Layer, Rect, type CanvasRefExpose } from '../index'

const createMock2dContext = () =>
	({
		globalAlpha: 1,
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 1,
		imageSmoothingEnabled: true,
		save: vi.fn(),
		restore: vi.fn(),
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		rect: vi.fn(),
		clip: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		setTransform: vi.fn(),
		scale: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		drawImage: vi.fn(),
	}) as unknown as CanvasRenderingContext2D

describe('canvasify-react layer surface', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'devicePixelRatio', {
			value: 1,
			configurable: true,
		})
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn(() => 1),
		)
		vi.stubGlobal('cancelAnimationFrame', vi.fn())
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
			createMock2dContext(),
		)
	})

	afterEach(() => {
		cleanup()
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('updates viewport and bitmap constraints without recreating the layer', () => {
		const ref = createRef<CanvasRefExpose>()
		const view = render(
			<Canvas
				ref={ref}
				width={1000}
				height={800}
				viewport={{ x: 100, y: 50, width: 200, height: 100 }}
				pixelRatio={2}
				maxPixelCount={100_000}
			>
				<Layer name="main">
					<Rect width={10} height={10} fillColor="red" />
				</Layer>
			</Canvas>,
		)

		const initialLayer = ref.current?.getLayer('main')
		const canvasElement = view.container.querySelector('canvas')
		expect(initialLayer).toBeDefined()
		expect(initialLayer?.getSize()).toEqual({ width: 1000, height: 800 })
		expect(initialLayer?.getViewport()).toEqual({
			x: 100,
			y: 50,
			width: 200,
			height: 100,
		})
		expect(initialLayer?.getPixelRatio()).toBe(2)
		expect(canvasElement).toMatchObject({ width: 400, height: 200 })
		expect(canvasElement?.style.left).toBe('100px')
		expect(canvasElement?.style.top).toBe('50px')

		view.rerender(
			<Canvas
				ref={ref}
				width={1200}
				height={900}
				viewport={{ x: 300, y: 150, width: 120, height: 60 }}
				pixelRatio={3}
				maxPixelCount={28_800}
			>
				<Layer name="main">
					<Rect width={10} height={10} fillColor="red" />
				</Layer>
			</Canvas>,
		)

		const updatedLayer = ref.current?.getLayer('main')
		expect(updatedLayer).toBe(initialLayer)
		expect(updatedLayer?.getSize()).toEqual({ width: 1200, height: 900 })
		expect(updatedLayer?.getViewport()).toEqual({
			x: 300,
			y: 150,
			width: 120,
			height: 60,
		})
		expect(updatedLayer?.getPixelRatio()).toBe(2)
		expect(canvasElement).toMatchObject({ width: 240, height: 120 })
		expect(canvasElement?.style.left).toBe('300px')
		expect(canvasElement?.style.top).toBe('150px')
	})

	it('updates and removes the dedicated export renderer', () => {
		const ref = createRef<CanvasRefExpose>()
		const screenRenderer = vi.fn<RenderLayer>()
		const initialExportRenderer = vi.fn<RenderLayer>()
		const updatedExportRenderer = vi.fn<RenderLayer>()
		const renderScene = (exportRenderer?: RenderLayer) => (
			<Canvas ref={ref} width={200} height={100}>
				<Layer name="main" renderer={screenRenderer} exportRenderer={exportRenderer}>
					<Rect width={10} height={10} fillColor="red" />
				</Layer>
			</Canvas>
		)
		const view = render(renderScene(initialExportRenderer))
		const layer = ref.current?.getLayer('main')
		const exportContext = createMock2dContext()
		if (!layer) {
			throw new Error('Layer not found')
		}

		layer.renderToContext(exportContext, { width: 200, height: 100 })
		expect(initialExportRenderer).toHaveBeenCalledTimes(1)
		expect(screenRenderer).not.toHaveBeenCalled()

		view.rerender(renderScene(updatedExportRenderer))
		layer.renderToContext(exportContext, { width: 200, height: 100 })
		expect(updatedExportRenderer).toHaveBeenCalledTimes(1)
		expect(initialExportRenderer).toHaveBeenCalledTimes(1)

		view.rerender(renderScene())
		layer.renderToContext(exportContext, { width: 200, height: 100 })
		expect(screenRenderer).toHaveBeenCalledTimes(1)
		expect(updatedExportRenderer).toHaveBeenCalledTimes(1)
	})

	it('disposes the owned core layer on unmount', () => {
		const ref = createRef<CanvasRefExpose>()
		const view = render(
			<Canvas ref={ref} width={200} height={100}>
				<Layer name="main">
					<Rect width={10} height={10} fillColor="red" />
				</Layer>
			</Canvas>,
		)
		const layer = ref.current?.getLayer('main')
		if (!layer) {
			throw new Error('Layer not found')
		}
		const dispose = vi.spyOn(layer, 'dispose')

		view.unmount()

		expect(dispose).toHaveBeenCalledTimes(1)
	})
})
