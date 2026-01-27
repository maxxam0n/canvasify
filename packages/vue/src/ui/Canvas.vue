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
import { computed, onUnmounted, provide } from 'vue'
import { Canvas } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'
import type { CanvasProps } from './Canvas.types'

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

defineExpose({
	getCore: () => canvas,
	getLayer: (name: string) => canvas.getLayer(name),
})
</script>
