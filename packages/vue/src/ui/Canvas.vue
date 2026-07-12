<template>
	<div
		ref="rootEl"
		class="relative"
		:style="{
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
		}"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import type { CanvasRefExpose } from '../lib/canvas.types'
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import {
	Canvas,
	createPointerInteraction,
	type PointerInteraction,
	type ShapePointerEvent,
	type ShapeWheelEvent,
} from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

export interface CanvasProps {
	width?: number
	height?: number
	background?: string
}

const props = withDefaults(defineProps<CanvasProps>(), {
	height: 300,
	width: 500,
	background: 'transparent',
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
const rootEl = ref<HTMLElement | null>(null)
let pointerInteraction: PointerInteraction | null = null

const width = computed(() => props.width)
const height = computed(() => props.height)

provide(CANVAS_TOKENS.CANVAS, canvas)
provide(CANVAS_TOKENS.WIDTH, width)
provide(CANVAS_TOKENS.HEIGHT, height)

watch(
	() => props.background,
	background => {
		canvas.setDefaultBackground(background)
	},
	{ immediate: true },
)

onMounted(() => {
	const target = rootEl.value
	if (!target) return

	pointerInteraction = createPointerInteraction({
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
	pointerInteraction.attach()
})

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
