<template>
	<canvas ref="canvasRef" class="absolute left-0 top-0" :style="{ zIndex, opacity }" />
	<slot />
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { computed, inject, provide, useTemplateRef, watchEffect } from 'vue'
import { Layer } from '@maxxam0n/canvasify-core'
import type { Canvas } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'
import type { LayerProps } from './Layer.types'

const props = withDefaults(defineProps<LayerProps>(), {
	opacity: 1,
	zIndex: 0,
})

const canvas = inject<Canvas>(CANVAS_TOKENS.CANVAS)
const width = inject<ComputedRef<number>>(CANVAS_TOKENS.WIDTH)
const height = inject<ComputedRef<number>>(CANVAS_TOKENS.HEIGHT)

const canvasRef = useTemplateRef('canvasRef')

const layer = computed(() => {
	if (!width || !height || !canvasRef.value) return null

	const layer = new Layer({
		name: props.name,
		opacity: props.opacity,
		renderer: props.renderer,
		canvas: canvasRef.value,
		onDirty: () => canvas?.requestRender(),
	})

	return layer.setSize(width.value, height.value)
})

provide(CANVAS_TOKENS.LAYER, layer)

watchEffect(onCleanup => {
	const currentLayer = layer.value

	if (canvas && currentLayer) {
		canvas.deleteLayer(currentLayer.name).setLayer(currentLayer)
	}

	onCleanup(() => {
		if (canvas && currentLayer) {
			canvas.deleteLayer(currentLayer.name)
		}
	})
})

defineExpose({
	getCore: () => layer.value,
})
</script>
