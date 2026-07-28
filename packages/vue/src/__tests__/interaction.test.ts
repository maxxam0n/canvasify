/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

import { Canvas, Layer, Rect } from '../index'
import type { CanvasRefExpose } from '../lib/canvas.types'

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

const getCanvasContainer = (wrapper: ReturnType<typeof mount>): HTMLElement => {
	const root = wrapper.element
	if (!(root instanceof HTMLElement)) {
		throw new Error('Canvas root container not found')
	}
	root.getBoundingClientRect = vi.fn(() => mockBoundingRect())
	return root
}

const waitForLayerShapes = async (
	canvasRef: { value: CanvasRefExpose | null },
	layerName = 'main',
	expectedCount = 1,
): Promise<void> => {
	await flushPromises()
	await nextTick()

	for (let attempt = 0; attempt < 20; attempt++) {
		const size = canvasRef.value?.getCore().getLayer(layerName)?.shapes.size ?? 0
		if (size >= expectedCount) return
		await nextTick()
	}

	throw new Error(`Layer "${layerName}" did not register ${expectedCount} shape(s)`)
}

const getRegisteredShapeContext = (
	canvasRef: { value: CanvasRefExpose | null },
	layerName = 'main',
) => {
	const layer = canvasRef.value?.getCore().getLayer(layerName)
	if (!layer || layer.shapes.size === 0) {
		throw new Error(`No shapes registered on layer "${layerName}"`)
	}
	return [...layer.shapes.values()][0]
}

describe('canvasify-vue interaction', () => {
	beforeEach(() => {
		setupEnvironment()
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('emits shapePointerDown when pointer hits a shape', async () => {
		const onShapePointerDown = vi.fn()
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: CANVAS_WIDTH,
							height: CANVAS_HEIGHT,
							onShapePointerDown,
						},
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Rect, {
												x: 0,
												y: 0,
												width: CANVAS_WIDTH,
												height: CANVAS_HEIGHT,
												fillColor: 'red',
											}),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)

		const root = getCanvasContainer(wrapper)
		const shapeCtx = getRegisteredShapeContext(canvasRef)
		expect(shapeCtx.listening).not.toBe(false)
		expect(canvasRef.value?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeDefined()

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).toHaveBeenCalledTimes(1)
		expect(onShapePointerDown).toHaveBeenCalledWith(
			expect.objectContaining({
				x: HIT_CLIENT.x,
				y: HIT_CLIENT.y,
				hit: expect.objectContaining({ layerName: 'main' }),
			}),
		)

		wrapper.unmount()
	})

	it('enables auto interaction for an array of listeners', async () => {
		const firstHandler = vi.fn()
		const secondHandler = vi.fn()
		const canvasRef = ref<CanvasRefExpose | null>(null)
		const canvasProps: Record<string, unknown> = {
			ref: canvasRef,
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT,
			onShapePointerDown: [firstHandler, secondHandler],
		}

		const App = defineComponent({
			setup() {
				return () =>
					h(Canvas, canvasProps, {
						default: () =>
							h(
								Layer,
								{ name: 'main' },
								{
									default: () =>
										h(Rect, {
											x: 0,
											y: 0,
											width: CANVAS_WIDTH,
											height: CANVAS_HEIGHT,
											fillColor: 'red',
										}),
								},
							),
					})
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)
		const root = getCanvasContainer(wrapper)

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(firstHandler).toHaveBeenCalledTimes(1)
		expect(secondHandler).toHaveBeenCalledTimes(1)
		wrapper.unmount()
	})

	it('enables auto interaction for a once listener', async () => {
		const onShapePointerDown = vi.fn()
		const canvasRef = ref<CanvasRefExpose | null>(null)
		const canvasProps: Record<string, unknown> = {
			ref: canvasRef,
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT,
			onShapePointerDownOnce: onShapePointerDown,
		}

		const App = defineComponent({
			setup() {
				return () =>
					h(Canvas, canvasProps, {
						default: () =>
							h(
								Layer,
								{ name: 'main' },
								{
									default: () =>
										h(Rect, {
											x: 0,
											y: 0,
											width: CANVAS_WIDTH,
											height: CANVAS_HEIGHT,
											fillColor: 'red',
										}),
								},
							),
					})
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)
		const root = getCanvasContainer(wrapper)

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)
		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).toHaveBeenCalledTimes(1)
		wrapper.unmount()
	})

	it('does not emit shapePointerDown when shape has listening=false', async () => {
		const onShapePointerDown = vi.fn()
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: CANVAS_WIDTH,
							height: CANVAS_HEIGHT,
							onShapePointerDown,
						},
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Rect, {
												x: 0,
												y: 0,
												width: CANVAS_WIDTH,
												height: CANVAS_HEIGHT,
												fillColor: 'red',
												listening: false,
											}),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)

		const root = getCanvasContainer(wrapper)
		const shapeCtx = getRegisteredShapeContext(canvasRef)
		expect(shapeCtx.listening).toBe(false)
		expect(canvasRef.value?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeUndefined()

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).not.toHaveBeenCalled()

		wrapper.unmount()
	})

	it('does not attach pointer interaction when interaction=false', async () => {
		const onShapePointerDown = vi.fn()
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: CANVAS_WIDTH,
							height: CANVAS_HEIGHT,
							interaction: false,
							onShapePointerDown,
						},
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Rect, {
												x: 0,
												y: 0,
												width: CANVAS_WIDTH,
												height: CANVAS_HEIGHT,
												fillColor: 'red',
											}),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)
		const root = getCanvasContainer(wrapper)

		dispatchPointer(root, 'pointerdown', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(onShapePointerDown).not.toHaveBeenCalled()
		wrapper.unmount()
	})

	it('sets container cursor from shape cursor on pointermove', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: CANVAS_WIDTH,
							height: CANVAS_HEIGHT,
							interaction: true,
						},
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Rect, {
												x: 0,
												y: 0,
												width: CANVAS_WIDTH,
												height: CANVAS_HEIGHT,
												fillColor: 'red',
												cursor: 'pointer',
											}),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await waitForLayerShapes(canvasRef)

		const root = getCanvasContainer(wrapper)
		const shapeCtx = getRegisteredShapeContext(canvasRef)
		expect(shapeCtx.listening).not.toBe(false)
		expect(canvasRef.value?.hitTest(HIT_CLIENT.x, HIT_CLIENT.y)).toBeDefined()

		dispatchPointer(root, 'pointermove', HIT_CLIENT.x, HIT_CLIENT.y)

		expect(root.style.cursor).toBe('pointer')

		wrapper.unmount()
	})
})
