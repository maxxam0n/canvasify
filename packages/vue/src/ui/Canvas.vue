<script setup lang="ts">
import type { CanvasRefExpose } from '../lib/canvas.types'
import {
	computed,
	getCurrentInstance,
	onBeforeUnmount,
	onMounted,
	onUpdated,
	provide,
	useTemplateRef,
	watch,
} from 'vue'
import {
	Canvas,
	createPointerInteraction,
	type PointerInteraction,
	type Rect,
	type ShapePointerEvent,
	type ShapeWheelEvent,
} from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

export interface CanvasProps {
	width?: number
	height?: number
	background?: string
	/** Visible surface in world coordinates. Null renders the full scene. */
	viewport?: Rect | null
	/** Requested bitmap pixel ratio. Defaults to devicePixelRatio. */
	pixelRatio?: number
	/** Maximum number of physical pixels allocated by each layer. */
	maxPixelCount?: number
	/**
	 * Pointer interaction mode. `auto` attaches listeners only when shape
	 * interaction events are subscribed.
	 */
	interaction?: boolean | 'auto'
}

defineSlots<{ default?: () => unknown }>()

const props = withDefaults(defineProps<CanvasProps>(), {
	height: 300,
	width: 500,
	background: 'transparent',
	viewport: null,
	pixelRatio: undefined,
	maxPixelCount: undefined,
	interaction: 'auto',
})

const emit = defineEmits<{
	shapePointerDown: [event: ShapePointerEvent]
	shapePointerMove: [event: ShapePointerEvent]
	shapePointerUp: [event: ShapePointerEvent]
	shapePointerEnter: [event: ShapePointerEvent]
	shapePointerLeave: [event: ShapePointerEvent]
	shapePointerCancel: [event: ShapePointerEvent]
	shapeWheel: [event: ShapeWheelEvent]
	shapeClick: [event: ShapePointerEvent]
}>()

const canvas = new Canvas()
const rootEl = useTemplateRef<HTMLElement>('rootEl')
const instance = getCurrentInstance()
let pointerInteraction: PointerInteraction | null = null

const width = computed(() => props.width)
const height = computed(() => props.height)
const viewport = computed<Rect | null>(() => {
	const value = props.viewport
	return value ? { x: value.x, y: value.y, width: value.width, height: value.height } : null
})
const pixelRatio = computed(() => props.pixelRatio)
const maxPixelCount = computed(() => props.maxPixelCount)

provide(CANVAS_TOKENS.CANVAS, canvas)
provide(CANVAS_TOKENS.WIDTH, width)
provide(CANVAS_TOKENS.HEIGHT, height)
provide(CANVAS_TOKENS.VIEWPORT, viewport)
provide(CANVAS_TOKENS.PIXEL_RATIO, pixelRatio)
provide(CANVAS_TOKENS.MAX_PIXEL_COUNT, maxPixelCount)

watch(
	() => props.background,
	background => {
		canvas.setDefaultBackground(background)
	},
	{ immediate: true },
)

const interactionListenerKeys = [
	'onShapePointerDown',
	'onShapePointerMove',
	'onShapePointerUp',
	'onShapePointerEnter',
	'onShapePointerLeave',
	'onShapePointerCancel',
	'onShapeWheel',
	'onShapeClick',
] as const

const isEventHandler = (value: unknown): boolean =>
	typeof value === 'function' ||
	(Array.isArray(value) && value.some(handler => typeof handler === 'function'))

const hasInteractionListener = (): boolean => {
	const vnodeProps = instance?.vnode.props as Readonly<Record<string, unknown>> | null | undefined
	return interactionListenerKeys.some(
		key => isEventHandler(vnodeProps?.[key]) || isEventHandler(vnodeProps?.[`${key}Once`]),
	)
}

const shouldEnableInteraction = (): boolean =>
	props.interaction === true || (props.interaction === 'auto' && hasInteractionListener())

const createInteraction = (target: HTMLElement): PointerInteraction =>
	createPointerInteraction({
		target,
		hitTest: (x, y) => canvas.hitTest(x, y),
		getShapeCursor: hit => canvas.getLayer(hit.layerName)?.shapes.get(hit.shapeId)?.cursor,
		onPointerDown: event => emit('shapePointerDown', event),
		onPointerMove: event => emit('shapePointerMove', event),
		onPointerUp: event => emit('shapePointerUp', event),
		onPointerEnter: event => emit('shapePointerEnter', event),
		onPointerLeave: event => emit('shapePointerLeave', event),
		onPointerCancel: event => emit('shapePointerCancel', event),
		onWheel: event => emit('shapeWheel', event),
		onClick: event => emit('shapeClick', event),
	})

const syncPointerInteraction = (): void => {
	const target = rootEl.value
	if (!target) return

	if (!shouldEnableInteraction()) {
		pointerInteraction?.destroy()
		pointerInteraction = null
		return
	}

	if (!pointerInteraction) {
		pointerInteraction = createInteraction(target)
		pointerInteraction.attach()
	}
}

watch(
	() => props.interaction,
	() => syncPointerInteraction(),
)

onMounted(() => {
	syncPointerInteraction()
})

onUpdated(syncPointerInteraction)

onBeforeUnmount(() => {
	pointerInteraction?.destroy()
	pointerInteraction = null
	canvas.cancelRender()
})

defineExpose<CanvasRefExpose>({
	getCore: () => canvas,
	getLayer: (name: string) => canvas.getLayer(name),
	hitTest: (x: number, y: number) => canvas.hitTest(x, y),
	toDataURL: (options?: import('@maxxam0n/canvasify-core').CanvasExportOptions) =>
		canvas.toDataURL(options),
	toBlob: (options?: import('@maxxam0n/canvasify-core').CanvasExportOptions) =>
		canvas.toBlob(options),
	layerToDataURL: (name: string, options?: import('@maxxam0n/canvasify-core').LayerExportOptions) =>
		canvas.layerToDataURL(name, options),
	layerToBlob: (name: string, options?: import('@maxxam0n/canvasify-core').LayerExportOptions) =>
		canvas.layerToBlob(name, options),
})
</script>

<template>
	<div
		ref="rootEl"
		:style="{
			position: 'relative',
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
		}"
	>
		<slot />
	</div>
</template>
