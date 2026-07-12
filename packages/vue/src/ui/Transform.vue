<template>
	<slot />
</template>

<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import { computed, inject, provide, toValue } from 'vue'
import type {
	Transform,
	RotationParams,
	ScaleParams,
	SkewParams,
	MatrixParams,
	TranslateParams,
	ClipRectParams,
} from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

export interface TransformProps {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
	skew?: Omit<SkewParams, 'type'>
	matrix?: Omit<MatrixParams, 'type'>
	clipRect?: Omit<ClipRectParams, 'type'>
}

const props = defineProps<TransformProps>()

const parentTransforms = inject<ComputedRef<Transform[]>>(
	CANVAS_TOKENS.TRANSFORMS,
	computed(() => []),
)

const localTransforms = computed<Transform[]>(() => {
	const { translate, scale, rotate, skew, matrix, clipRect } = props
	const transforms: Transform[] = []

	if (translate) transforms.push({ type: 'translate', ...translate })
	if (scale) transforms.push({ type: 'scale', ...scale })
	if (rotate) transforms.push({ type: 'rotation', ...rotate })
	if (skew) transforms.push({ type: 'skew', ...skew })
	if (matrix) transforms.push({ type: 'matrix', ...matrix })
	if (clipRect) transforms.push({ type: 'clip-rect', ...clipRect })

	return transforms
})

const combinedTransforms = computed<Transform[]>(() => {
	const parent = parentTransforms ? toValue(parentTransforms) : []

	return [...parent, ...toValue(localTransforms)]
})

provide(CANVAS_TOKENS.TRANSFORMS, combinedTransforms)
</script>
