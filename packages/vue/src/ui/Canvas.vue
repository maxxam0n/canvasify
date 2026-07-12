<template>
	<div
		class="relative"
		:style="{
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
		}"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@click="onClick"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import type { CanvasRefExpose } from '../lib/canvas.types'
import { computed, onUnmounted, provide, watch } from 'vue'
import { Canvas } from '@maxxam0n/canvasify-core'
import type { CanvasHitTestResult } from '@maxxam0n/canvasify-core'

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
	shapePointerDown: [event: PointerEvent, hit: CanvasHitTestResult]
	shapePointerMove: [event: PointerEvent, hit: CanvasHitTestResult]
	shapeClick: [event: MouseEvent, hit: CanvasHitTestResult]
}>()

const canvas = new Canvas()

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

onUnmounted(() => canvas.cancelRender())

const resolveHit = (event: MouseEvent | PointerEvent) => {
	const target = event.currentTarget as HTMLElement
	const rect = target.getBoundingClientRect()
	const x = event.clientX - rect.left
	const y = event.clientY - rect.top
	return canvas.hitTest(x, y)
}

const onPointerDown = (event: PointerEvent) => {
	const hit = resolveHit(event)
	if (hit) emit('shapePointerDown', event, hit)
}

const onPointerMove = (event: PointerEvent) => {
	const hit = resolveHit(event)
	if (hit) emit('shapePointerMove', event, hit)
}

const onClick = (event: MouseEvent) => {
	const hit = resolveHit(event)
	if (hit) emit('shapeClick', event, hit)
}

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
