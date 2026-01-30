<template>
	<div
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
import { computed, onUnmounted, provide } from 'vue'
import { Canvas } from '@maxxam0n/canvasify-core'

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

const canvas = new Canvas()

const width = computed(() => props.width)
const height = computed(() => props.height)

provide(CANVAS_TOKENS.CANVAS, canvas)
provide(CANVAS_TOKENS.WIDTH, width)
provide(CANVAS_TOKENS.HEIGHT, height)

onUnmounted(() => canvas.cancelRender())

defineExpose<CanvasRefExpose>({
	getCore: () => canvas,
	getLayer: (name: string) => canvas.getLayer(name),
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
