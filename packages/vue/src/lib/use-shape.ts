import type { ComputedRef } from 'vue'
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

export const useShape = (shape: ComputedRef<BaseShape | null>) => {
	const layer = inject<ComputedRef<Layer | null>>(CANVAS_TOKENS.LAYER)

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

		if (!layerValue || !shapeValue) return null

		const { opacity, zIndex } = shapeValue.shapeParams

		return {
			layerValue,
			shapeValue,
			appliedTransforms,
			opacity: opacity * groupParams.opacity,
			zIndex: zIndex + groupParams.zIndex,
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

			const { layerValue, shapeValue, appliedTransforms, opacity, zIndex } = next

			const shapeDrawingContext: ShapeDrawingContext = {
				id: shapeId,
				shapeParams: { opacity, zIndex },
				meta: shapeValue.meta,
				draw: () => shapeValue!.draw(layerValue.ctx),
				transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, appliedTransforms),
			}

			layerValue.setShape(shapeDrawingContext)

			currentCtx = { ctx: shapeDrawingContext, layer: layerValue }

			onCleanup(() => {
				layerValue.removeShape(shapeDrawingContext)
				currentCtx = null
			})
		},
		{ immediate: true },
	)
}
