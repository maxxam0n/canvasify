/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'

import {
	Canvas,
	Circle,
	Ellipse,
	Group,
	Image as CanvasImage,
	Layer,
	Line,
	Path,
	Polygon,
	Rect,
	Text,
	Transform,
} from '../index'
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
		arc: vi.fn(),
		arcTo: vi.fn(),
		ellipse: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		quadraticCurveTo: vi.fn(),
		bezierCurveTo: vi.fn(),
		rect: vi.fn(),
		clip: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		fillText: vi.fn(),
		strokeText: vi.fn(),
		measureText: vi.fn(() => ({ width: 40 }) as TextMetrics),
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

	it('registers every public shape wrapper inside Group and Transform', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 300, height: 200 },
						{
							default: () =>
								h(
									Layer,
									{ name: 'all-shapes' },
									{
										default: () =>
											h(
												Group,
												{ opacity: 0.8, zIndex: 2 },
												{
													default: () =>
														h(
															Transform,
															{ translate: { translateX: 5, translateY: 10 } },
															{
																default: () => [
																	h(Rect, { width: 20, height: 10, fillColor: 'red' }),
																	h(Circle, { cx: 30, cy: 30, radius: 10, fillColor: 'blue' }),
																	h(Ellipse, {
																		cx: 60,
																		cy: 30,
																		radiusX: 15,
																		radiusY: 8,
																		fillColor: 'green',
																	}),
																	h(Line, {
																		x1: 0,
																		y1: 50,
																		x2: 40,
																		y2: 50,
																		strokeColor: 'black',
																	}),
																	h(Polygon, {
																		points: [
																			{ x: 60, y: 50 },
																			{ x: 80, y: 80 },
																			{ x: 40, y: 80 },
																		],
																		fillColor: 'orange',
																	}),
																	h(Text, { text: 'Canvasify', x: 100, y: 30 }),
																	h(Path, {
																		commands: [
																			{ type: 'moveTo', x: 100, y: 60 },
																			{ type: 'lineTo', x: 140, y: 80 },
																		],
																		strokeColor: 'purple',
																	}),
																	h(CanvasImage, {
																		src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
																		x: 150,
																		y: 20,
																		width: 20,
																		height: 20,
																	}),
																],
															},
														),
												},
											),
									},
								),
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await flushPromises()
		await nextTick()

		const layer = canvasRef.value?.getCore().getLayer('all-shapes')
		expect(layer?.shapes.size).toBe(8)
		expect([...(layer?.shapes.values() ?? [])]).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					shapeParams: expect.objectContaining({ opacity: 0.8 }),
					transforms: expect.arrayContaining([expect.objectContaining({ type: 'translate' })]),
				}),
			]),
		)
		const polygonContext = [...(layer?.shapes.values() ?? [])].find(shape =>
			Array.isArray(shape.meta.points),
		)
		const polygonCanvasContext = createMock2dContext()
		polygonContext?.draw(polygonCanvasContext)
		expect(polygonContext?.meta.closed).toBeUndefined()
		expect(polygonCanvasContext.closePath).toHaveBeenCalledTimes(1)
		expect(polygonCanvasContext.fill).toHaveBeenCalledTimes(1)

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

	it('updates the backing surface after an in-place reactive viewport mutation', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)
		const viewport = reactive({ x: 40, y: 20, width: 200, height: 100 })

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 1_000, height: 800, viewport },
						{ default: () => h(Layer, { name: 'main' }) },
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await flushPromises()
		await nextTick()

		const layer = canvasRef.value?.getLayer('main')
		expect(layer?.getViewport().x).toBe(40)

		viewport.x = 260
		await nextTick()
		await flushPromises()

		expect(layer?.getViewport().x).toBe(260)
		expect(layer?.canvas.style.left).toBe('260px')

		wrapper.unmount()
	})

	it('positions multiple viewport layers without external CSS', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{
							ref: canvasRef,
							width: 1_000,
							height: 800,
							viewport: { x: 120, y: 30, width: 240, height: 160 },
						},
						{
							default: () => [
								h(Layer, { name: 'background', zIndex: 1 }),
								h(Layer, { name: 'foreground', zIndex: 2 }),
							],
						},
					)
			},
		})

		const wrapper = mount(App, { attachTo: document.body })
		await flushPromises()
		await nextTick()

		const root = wrapper.element
		expect(root).toBeInstanceOf(HTMLElement)
		expect((root as HTMLElement).style.position).toBe('relative')

		const canvases = wrapper.findAll('canvas')
		expect(canvases).toHaveLength(2)
		for (const canvas of canvases) {
			expect(canvas.element.style.position).toBe('absolute')
			expect(canvas.element.style.left).toBe('120px')
			expect(canvas.element.style.top).toBe('30px')
			expect(canvas.element.style.width).toBe('240px')
			expect(canvas.element.style.height).toBe('160px')
		}
		expect(canvases[0].element.style.zIndex).toBe('1')
		expect(canvases[1].element.style.zIndex).toBe('2')
		expect(canvasRef.value?.getLayer('background')?.canvas).toBe(canvases[0].element)
		expect(canvasRef.value?.getLayer('foreground')?.canvas).toBe(canvases[1].element)

		wrapper.unmount()
	})

	it('moves the layer registration when its name changes', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			props: {
				layerName: { type: String, required: true },
			},
			setup(props) {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 200, height: 100 },
						{
							default: () => h(Layer, { name: props.layerName }),
						},
					)
			},
		})

		const wrapper = mount(App, {
			props: { layerName: 'before' },
			attachTo: document.body,
		})
		await flushPromises()
		await nextTick()

		const core = canvasRef.value!.getCore()
		const initialLayer = core.getLayer('before')
		expect(initialLayer).toBeDefined()

		await wrapper.setProps({ layerName: 'after' })
		await flushPromises()
		await nextTick()

		expect(core.getLayer('before')).toBeUndefined()
		expect(core.getLayer('after')).toBeDefined()
		expect(core.getLayer('after')).not.toBe(initialLayer)

		wrapper.unmount()
		expect(core.getLayer('after')).toBeUndefined()
	})

	it('does not remove a replacement layer during stale cleanup', async () => {
		const canvasRef = ref<CanvasRefExpose | null>(null)

		const App = defineComponent({
			props: {
				showFirst: { type: Boolean, required: true },
			},
			setup(props) {
				return () =>
					h(
						Canvas,
						{ ref: canvasRef, width: 200, height: 100 },
						{
							default: () => [
								props.showFirst ? h(Layer, { key: 'first', name: 'shared' }) : null,
								h(Layer, { key: 'replacement', name: 'shared' }),
							],
						},
					)
			},
		})

		const wrapper = mount(App, {
			props: { showFirst: true },
			attachTo: document.body,
		})
		await flushPromises()
		await nextTick()

		const core = canvasRef.value!.getCore()
		const replacement = core.getLayer('shared')
		expect(replacement).toBeDefined()
		expect(wrapper.findAll('canvas')).toHaveLength(2)

		await wrapper.setProps({ showFirst: false })
		await flushPromises()
		await nextTick()

		expect(wrapper.findAll('canvas')).toHaveLength(1)
		expect(core.getLayer('shared')).toBe(replacement)
		expect(core.getLayer('shared')?.canvas).toBe(wrapper.get('canvas').element)

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
