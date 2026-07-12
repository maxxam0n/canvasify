import type { ComputedRef, Ref } from 'vue'
import { computed, inject, toValue, useId, watch } from 'vue'
import type {
	BaseShape,
	GroupParams,
	Layer,
	ShapeDrawingContext,
	Transform,
} from '@maxxam0n/canvasify-core'
import { applyTransformsToCtx } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from './tokens'
import type { UseShapeOptions } from './use-shape.types'

export const useShape = (
	shape: ComputedRef<BaseShape | null>,
	options?: ComputedRef<UseShapeOptions | undefined>,
) => {
	const layer = inject<Ref<Layer | null> | ComputedRef<Layer | null>>(CANVAS_TOKENS.LAYER)

	const transforms = inject<ComputedRef<Transform[]>>(
		CANVAS_TOKENS.TRANSFORMS,
		computed(() => []),
	)

	const group = inject<ComputedRef<GroupParams>>(
		CANVAS_TOKENS.GROUP,
		computed(() => ({ opacity: 1, zIndex: 0 })),
	)

	if (!layer) {
		throw new Error('failed to register shape: layer not found')
	}

	const shapeId = useId()

	const derived = computed(() => {
		const layerValue = toValue(layer)
		const shapeValue = toValue(shape)
		const appliedTransforms = toValue(transforms)
		const groupParams = toValue(group)
		const interaction = options ? toValue(options) : undefined

		if (!layerValue || !shapeValue) return null

		const { opacity, zIndex } = shapeValue.shapeParams

		return {
			layerValue,
			shapeValue,
			appliedTransforms,
			opacity: opacity * groupParams.opacity,
			zIndex: zIndex + groupParams.zIndex,
			listening: interaction?.listening,
			cursor: interaction?.cursor,
			hitStrokeWidth: interaction?.hitStrokeWidth,
			shadowColor: interaction?.shadowColor,
			shadowBlur: interaction?.shadowBlur,
			shadowOffsetX: interaction?.shadowOffsetX,
			shadowOffsetY: interaction?.shadowOffsetY,
			globalCompositeOperation: interaction?.globalCompositeOperation,
		}
	})

	let currentCtx: { ctx: ShapeDrawingContext; layer: Layer } | null = null

	watch(
		derived,
		(next, _prev, onCleanup) => {
			if (currentCtx) {
				currentCtx.layer.removeShape(currentCtx.ctx)
				currentCtx = null
			}

			if (!next) return

			const {
				layerValue,
				shapeValue,
				appliedTransforms,
				opacity,
				zIndex,
				listening,
				cursor,
				hitStrokeWidth,
				shadowColor,
				shadowBlur,
				shadowOffsetX,
				shadowOffsetY,
				globalCompositeOperation,
			} = next

			const shapeDrawingContext: ShapeDrawingContext = {
				id: shapeId,
				shapeParams: { opacity, zIndex },
				meta: shapeValue.meta,
				transforms: appliedTransforms,
				draw: (ctx: CanvasRenderingContext2D) => shapeValue.draw(ctx),
				transform: (ctx: CanvasRenderingContext2D) =>
					applyTransformsToCtx(ctx, appliedTransforms),
				contains: shapeValue.contains
					? (x, y) => shapeValue.contains!(x, y)
					: undefined,
				getLocalBounds: shapeValue.getLocalBounds
					? () => shapeValue.getLocalBounds!()
					: undefined,
				// Не записываем listening/cursor, пока prop не задан явно (Vue Boolean default).
				...(listening !== undefined ? { listening } : {}),
				...(cursor !== undefined ? { cursor } : {}),
				...(hitStrokeWidth !== undefined ? { hitStrokeWidth } : {}),
				...(shadowColor !== undefined ? { shadowColor } : {}),
				...(shadowBlur !== undefined ? { shadowBlur } : {}),
				...(shadowOffsetX !== undefined ? { shadowOffsetX } : {}),
				...(shadowOffsetY !== undefined ? { shadowOffsetY } : {}),
				...(globalCompositeOperation !== undefined ? { globalCompositeOperation } : {}),
			}

			layerValue.setShape(shapeDrawingContext, { source: shapeValue })

			const unsubscribe = shapeValue.subscribeInvalidate?.(() =>
				layerValue.invalidateShape(shapeId),
			)

			currentCtx = { ctx: shapeDrawingContext, layer: layerValue }

			onCleanup(() => {
				unsubscribe?.()
				layerValue.removeShape(shapeDrawingContext)
				currentCtx = null
			})
		},
		{ immediate: true },
	)
}
