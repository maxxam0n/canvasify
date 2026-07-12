<template>
	<canvas ref="canvasRef" class="absolute left-0 top-0" :style="{ zIndex }" />
	<slot />
</template>

<script setup lang="ts">
import type { ComputedRef, Ref } from 'vue'
import { inject, provide, shallowRef, useTemplateRef, watch } from 'vue'
import { Layer } from '@maxxam0n/canvasify-core'
import type { Canvas, RenderLayer } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

export interface LayerProps {
	name: string
	opacity?: number
	zIndex?: number
	renderer?: RenderLayer
}

const props = withDefaults(defineProps<LayerProps>(), {
	opacity: 1,
	zIndex: 0,
	renderer: undefined,
})

const canvas = inject<Canvas>(CANVAS_TOKENS.CANVAS)
const width = inject<ComputedRef<number>>(CANVAS_TOKENS.WIDTH)
const height = inject<ComputedRef<number>>(CANVAS_TOKENS.HEIGHT)

const canvasRef = useTemplateRef('canvasRef')
const layer = shallowRef<Layer | null>(null) as Ref<Layer | null>

provide(CANVAS_TOKENS.LAYER, layer)

// Создаём Layer при появлении canvas-элемента; пересоздаём только при смене name
watch(
	[canvasRef, () => props.name],
	([el], _prev, onCleanup) => {
		if (!el || !canvas || !width || !height) return

		const nextLayer = new Layer({
			name: props.name,
			canvas: el,
			opacity: props.opacity,
			zIndex: props.zIndex,
			onDirty: () => canvas.requestRender(),
		})
		nextLayer.setSize(width.value, height.value)
		nextLayer.setRenderer(props.renderer)

		canvas.deleteLayer(props.name).setLayer(nextLayer)
		layer.value = nextLayer

		onCleanup(() => {
			canvas.deleteLayer(props.name)
			if (layer.value === nextLayer) {
				layer.value = null
			}
		})
	},
	{ immediate: true },
)

watch(
	[() => width?.value, () => height?.value],
	([w, h]) => {
		if (layer.value && typeof w === 'number' && typeof h === 'number') {
			layer.value.setSize(w, h)
		}
	},
)

watch(
	() => props.opacity,
	opacity => {
		layer.value?.setOpacity(opacity)
	},
)

watch(
	() => props.zIndex,
	zIndex => {
		layer.value?.setZIndex(zIndex)
	},
)

watch(
	() => props.renderer,
	renderer => {
		layer.value?.setRenderer(renderer)
	},
)

defineExpose({
	getCore: () => layer.value,
})
</script>
