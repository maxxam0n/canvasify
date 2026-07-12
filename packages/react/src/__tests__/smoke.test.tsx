/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'

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

describe('canvasify-react smoke', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				cb(0)
				return 1
			}),
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

	it('mounts Canvas/Layer/Rect and registers shape on layer', () => {
		const ref = createRef<CanvasRefExpose>()

		render(
			<Canvas ref={ref} width={200} height={100} background="#112233">
				<Layer name="main">
					<Rect x={10} y={10} width={40} height={20} fillColor="red" />
				</Layer>
			</Canvas>,
		)

		const core = ref.current?.getCore()
		expect(core).toBeDefined()

		const layer = core?.getLayer('main')
		expect(layer).toBeDefined()
		expect(layer?.shapes.size).toBe(1)
	})

	it('applies Canvas background as default export background', () => {
		const ref = createRef<CanvasRefExpose>()

		render(
			<Canvas ref={ref} width={100} height={50} background="#ff00aa">
				<Layer name="main">
					<Rect width={10} height={10} fillColor="blue" />
				</Layer>
			</Canvas>,
		)

		const core = ref.current!.getCore()
		const createElement = document.createElement.bind(document)
		const fillStyles: string[] = []

		vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
			const el = createElement(tagName)
			if (tagName === 'canvas') {
				const canvas = el as HTMLCanvasElement
				Object.defineProperty(canvas, 'width', { value: 100, writable: true })
				Object.defineProperty(canvas, 'height', { value: 50, writable: true })
				canvas.getContext = vi.fn(() => {
					const ctx = createMock2dContext() as CanvasRenderingContext2D & {
						fillStyle: string
					}
					Object.defineProperty(ctx, 'fillStyle', {
						get: () => fillStyles[fillStyles.length - 1] ?? '',
						set: (v: string) => {
							fillStyles.push(v)
						},
						configurable: true,
					})
					return ctx
				})
				canvas.toDataURL = vi.fn(() => 'data:image/png;base64,stub')
			}
			return el
		})

		core.toDataURL()
		expect(fillStyles).toContain('#ff00aa')
	})

	it('unmount removes layer from canvas', () => {
		const ref = createRef<CanvasRefExpose>()

		const { unmount } = render(
			<Canvas ref={ref} width={200} height={100}>
				<Layer name="main">
					<Rect width={10} height={10} fillColor="red" />
				</Layer>
			</Canvas>,
		)

		const core = ref.current!.getCore()
		expect(core.getLayer('main')?.shapes.size).toBe(1)

		unmount()
		expect(core.getLayer('main')).toBeUndefined()
	})
})
