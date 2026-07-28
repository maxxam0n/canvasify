/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'

import { Canvas, Layer, Rect, type CanvasRefExpose } from '../index'

const CANVAS_WIDTH = 200
const CANVAS_HEIGHT = 100
const HIT_CLIENT = { x: 50, y: 50 }

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

const mockBoundingRect = (
	left = 0,
	top = 0,
	width = CANVAS_WIDTH,
	height = CANVAS_HEIGHT,
): DOMRect =>
	({
		left,
		top,
		right: left + width,
		bottom: top + height,
		width,
		height,
		x: left,
		y: top,
		toJSON: () => ({}),
	}) as DOMRect

const dispatchPointer = (
	target: HTMLElement,
	type: string,
	clientX: number,
	clientY: number,
): void => {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			clientX,
			clientY,
			pointerId: 1,
		}),
	)
}

const setupEnvironment = () => {
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
}

const getCanvasContainer = (renderContainer: HTMLElement): HTMLElement => {
	const root = renderContainer.firstElementChild
	if (!(root instanceof HTMLElement)) {
		throw new Error('Canvas root container not found')
	}
	root.getBoundingClientRect = vi.fn(() => mockBoundingRect())
	return root
}

describe('canvasify-react interaction', () => {
	beforeEach(() => {
		setupEnvironment()
	})

	afterEach(() => {
		cleanup()
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('fires onShapePointerDown when pointer hits a shape', () => {
		const onShapePointerDown = vi.fn()
		const ref = createRef<CanvasRefExpose>()

		const { container } = render(
			<Canvas
				ref={ref}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				onShapePointerDown={onShapePointerDown}
			>
				<Layer name="main">
					<Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fillColor="red" />
				</Layer>
			</Canvas>,
		)

		const root = getCanvasContainer(container)
		expect(ref.current?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeDefined()

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).toHaveBeenCalledTimes(1)
		expect(onShapePointerDown).toHaveBeenCalledWith(
			expect.objectContaining({
				x: HIT_CLIENT.x,
				y: HIT_CLIENT.y,
				hit: expect.objectContaining({ layerName: 'main' }),
			}),
		)
	})

	it('removes an event callback when its prop becomes undefined', () => {
		const onShapePointerDown = vi.fn()
		const ref = createRef<CanvasRefExpose>()
		const renderScene = (handler?: typeof onShapePointerDown) => (
			<Canvas ref={ref} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onShapePointerDown={handler}>
				<Layer name="main">
					<Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fillColor="red" />
				</Layer>
			</Canvas>
		)
		const view = render(renderScene(onShapePointerDown))
		const root = getCanvasContainer(view.container)

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)
		expect(onShapePointerDown).toHaveBeenCalledTimes(1)

		view.rerender(renderScene())
		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).toHaveBeenCalledTimes(1)
	})

	it('does not fire onShapePointerDown when shape has listening={false}', () => {
		const onShapePointerDown = vi.fn()
		const ref = createRef<CanvasRefExpose>()

		const { container } = render(
			<Canvas
				ref={ref}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				onShapePointerDown={onShapePointerDown}
			>
				<Layer name="main">
					<Rect
						x={0}
						y={0}
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
						fillColor="red"
						listening={false}
					/>
				</Layer>
			</Canvas>,
		)

		const root = getCanvasContainer(container)
		expect(ref.current?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeUndefined()

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).not.toHaveBeenCalled()
	})

	it('sets container cursor from shape cursor on pointermove', () => {
		const ref = createRef<CanvasRefExpose>()

		const { container } = render(
			<Canvas ref={ref} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
				<Layer name="main">
					<Rect
						x={0}
						y={0}
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
						fillColor="red"
						cursor="pointer"
					/>
				</Layer>
			</Canvas>,
		)

		const root = getCanvasContainer(container)
		expect(ref.current?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeDefined()

		dispatchPointer(root, 'pointermove', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(root.style.cursor).toBe('pointer')
	})
})
