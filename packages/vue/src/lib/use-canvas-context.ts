import type { ComputedRef } from 'vue'
import { computed, inject } from 'vue'
import type { Canvas, GroupParams, Layer, Transform } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from './tokens'

export const useCurrentLayer = (): ComputedRef<Layer | null>  => {
	const layer = inject<ComputedRef<Layer | null>>(CANVAS_TOKENS.LAYER)
	return layer ?? computed(() => null)
}

export const useCurrentCanvas = (): Canvas | undefined => {
	return inject<Canvas>(CANVAS_TOKENS.CANVAS)
}

export const useCanvasSize = (): ComputedRef<{ width: number; height: number } | null> => {
	const width = inject<ComputedRef<number>>(CANVAS_TOKENS.WIDTH)
	const height = inject<ComputedRef<number>>(CANVAS_TOKENS.HEIGHT)

	return computed(() => {
		if (!width || !height) return null
		return { width: width.value, height: height.value }
	})
}

export const useCurrentGroup = (): ComputedRef<GroupParams> => {
	const group = inject<ComputedRef<GroupParams>>(CANVAS_TOKENS.GROUP)
	return group ?? computed(() => ({ opacity: 1, zIndex: 0 }))
}

export const useCurrentTransforms = (): ComputedRef<Transform[]> => {
	const transforms = inject<ComputedRef<Transform[]>>(CANVAS_TOKENS.TRANSFORMS)
	return transforms ?? computed(() => [])
}
