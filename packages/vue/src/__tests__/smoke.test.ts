/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

import { Canvas, Layer, Rect } from '../index'
import type { CanvasRefExpose } from '../lib/canvas.types'
import type { Layer as CoreLayer } from '@maxxam0n/canvasify-core'

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

describe('canvasify-vue smoke', () => {
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
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('mounts Canvas/Layer/Rect and registers shape on layer', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 200, height: 100, background: '#112233' },
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Rect, {
												x: 10,
												y: 10,
												width: 40,
												height: 20,
												fillColor: 'red',
											}),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await flushPromises()
		await nextTick()

		const layer = canvasRef.value?.getCore().getLayer('main')
		expect(layer).toBeDefined()
		expect(layer?.shapes.size).toBe(1)

		wrapper.unmount()
	})

	it('keeps the same Layer instance when opacity changes', async () => {
		const layerCoreRef = ref<CoreLayer | null>(null)

		const App = defineComponent({
			props: {
				opacity: { type: Number, required: true },
			},
			setup(props) {
				return () =>
					h(
						Canvas,
						{ width: 200, height: 100 },
						{
							default: () =>
								h(
									Layer,
									{
										name: 'main',
										opacity: props.opacity,
										ref: (instance: unknown) => {
											const exposed = instance as { getCore?: () => CoreLayer | null } | null
											layerCoreRef.value = exposed?.getCore?.() ?? null
										},
									},
									{
										default: () => h(Rect, { width: 10, height: 10, fillColor: 'blue' }),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, {
			props: { opacity: 1 },
			attachTo: document.body,
		})
		await flushPromises()
		await nextTick()

		const firstLayer = layerCoreRef.value
		expect(firstLayer).not.toBeNull()
		expect(firstLayer?.opacity).toBe(1)

		await wrapper.setProps({ opacity: 0.4 })
		await flushPromises()
		await nextTick()

		expect(layerCoreRef.value).toBe(firstLayer)
		expect(layerCoreRef.value?.opacity).toBe(0.4)

		wrapper.unmount()
	})

	it('keeps the same Layer instance when canvas size changes', async () => {
		const layerCoreRef = ref<CoreLayer | null>(null)

		const App = defineComponent({
			props: {
				width: { type: Number, required: true },
				height: { type: Number, required: true },
			},
			setup(props) {
				return () =>
					h(
						Canvas,
						{ width: props.width, height: props.height },
						{
							default: () =>
								h(
									Layer,
									{
										name: 'main',
										ref: (instance: unknown) => {
											const exposed = instance as { getCore?: () => CoreLayer | null } | null
											layerCoreRef.value = exposed?.getCore?.() ?? null
										},
									},
									{
										default: () => h(Rect, { width: 10, height: 10, fillColor: 'blue' }),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, {
			props: { width: 200, height: 100 },
			attachTo: document.body,
		})
		await flushPromises()
		await nextTick()

		const firstLayer = layerCoreRef.value
		expect(firstLayer).not.toBeNull()

		await wrapper.setProps({ width: 400, height: 300 })
		await flushPromises()
		await nextTick()

		expect(layerCoreRef.value).toBe(firstLayer)

		wrapper.unmount()
	})

	it('updates the backing surface when viewport changes', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			props: {
				viewportX: { type: Number, required: true },
			},
			setup(props) {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: 1_000,
							height: 800,
							viewport: {
								x: props.viewportX,
								y: 20,
								width: 200,
								height: 100,
							},
						},
						{
							default: () => h(Layer, { name: 'main' }),
						},
					)
			},
		})

		const wrapper = mount(App, {
			props: { viewportX: 100 },
			attachTo: document.body,
		})
		await flushPromises()
		await nextTick()

		const layer = canvasRef.value?.getLayer('main')
		expect(layer?.getViewport()).toEqual({ x: 100, y: 20, width: 200, height: 100 })
		expect(layer?.canvas.width).toBe(200)
		expect(layer?.canvas.style.left).toBe('100px')

		await wrapper.setProps({ viewportX: 300 })
		await flushPromises()
		await nextTick()

		expect(layer?.getViewport()).toEqual({ x: 300, y: 20, width: 200, height: 100 })
		expect(layer?.canvas.style.left).toBe('300px')

		wrapper.unmount()
	})

	it('unmount removes layer from canvas', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 200, height: 100 },
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () => h(Rect, { width: 10, height: 10, fillColor: 'red' }),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await flushPromises()
		await nextTick()

		const core = canvasRef.value!.getCore()
		expect(core.getLayer('main')).toBeDefined()

		wrapper.unmount()
		expect(core.getLayer('main')).toBeUndefined()
	})
})
