<template>
	<canvas ref="canvasRef" class="absolute" :style="{ zIndex }" />
	<slot />
</template>

<script setup lang="ts">
import type { ComputedRef, Ref } from 'vue'
import { inject, provide, shallowRef, useTemplateRef, watch } from 'vue'
import { Layer } from '@maxxam0n/canvasify-core'
import type {
	Canvas,
	LayerWorkerRendererOptions,
	Rect,
	RenderLayer,
	SpatialIndexOptions,
} from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

export interface LayerProps {
	name: string
	opacity?: number
	zIndex?: number
	renderer?: RenderLayer
	exportRenderer?: RenderLayer
	/** Передаётся в конструктор Core Layer; смена prop пересоздаёт слой. */
	spatialIndex?: SpatialIndexOptions
	/**
	 * Experimental: paint в worker через OffscreenCanvas.
	 * Смена prop пересоздаёт слой — держите стабильную ссылку на createWorker / port.
	 */
	workerRenderer?: LayerWorkerRendererOptions
}

const props = withDefaults(defineProps<LayerProps>(), {
	opacity: 1,
	zIndex: 0,
	renderer: undefined,
	exportRenderer: undefined,
	spatialIndex: undefined,
	workerRenderer: undefined,
})

const canvas = inject<Canvas>(CANVAS_TOKENS.CANVAS)
const width = inject<ComputedRef<number>>(CANVAS_TOKENS.WIDTH)
const height = inject<ComputedRef<number>>(CANVAS_TOKENS.HEIGHT)
const viewport = inject<ComputedRef<Rect | null>>(CANVAS_TOKENS.VIEWPORT)
const pixelRatio = inject<ComputedRef<number | undefined>>(CANVAS_TOKENS.PIXEL_RATIO)
const maxPixelCount = inject<ComputedRef<number | undefined>>(CANVAS_TOKENS.MAX_PIXEL_COUNT)

const canvasRef = useTemplateRef('canvasRef')
const layer = shallowRef<Layer | null>(null) as Ref<Layer | null>

provide(CANVAS_TOKENS.LAYER, layer)

// Создаём Layer при появлении canvas-элемента; пересоздаём при смене name / spatialIndex / workerRenderer
watch(
	[canvasRef, () => props.name, () => props.spatialIndex, () => props.workerRenderer],
	([el], _prev, onCleanup) => {
		if (!el || !canvas || !width || !height) return

		const nextLayer = new Layer({
			name: props.name,
			canvas: el,
			opacity: props.opacity,
			zIndex: props.zIndex,
			renderer: props.workerRenderer ? undefined : props.renderer,
			exportRenderer: props.exportRenderer,
			spatialIndex: props.spatialIndex,
			workerRenderer: props.workerRenderer,
			onDirty: () => canvas.requestRender(),
		})
		nextLayer.setSurface({
			width: width.value,
			height: height.value,
			viewport: viewport?.value,
			pixelRatio: pixelRatio?.value,
			maxPixelCount: maxPixelCount?.value,
		})

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
	[
		() => width?.value,
		() => height?.value,
		() => viewport?.value,
		() => pixelRatio?.value,
		() => maxPixelCount?.value,
	],
	([w, h, nextViewport, nextPixelRatio, nextMaxPixelCount]) => {
		if (layer.value && typeof w === 'number' && typeof h === 'number') {
			layer.value.setSurface({
				width: w,
				height: h,
				viewport: nextViewport,
				pixelRatio: nextPixelRatio,
				maxPixelCount: nextMaxPixelCount,
			})
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
		if (props.workerRenderer) return
		layer.value?.setRenderer(renderer)
	},
)

watch(
	() => props.exportRenderer,
	renderer => {
		layer.value?.setExportRenderer(renderer)
	},
)

defineExpose({
	getCore: () => layer.value,
})
</script>
