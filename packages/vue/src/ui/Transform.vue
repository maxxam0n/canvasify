<template>
	<slot />
</template>

<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import { computed, inject, provide, toValue } from 'vue'
import type { Transform } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'
import type { TransformProps } from './Transform.types'

const props = defineProps<TransformProps>()

const parentTransforms = inject<ComputedRef<Transform[]>>(
	CANVAS_TOKENS.TRANSFORMS,
	computed(() => []),
)

const localTransforms = computed<Transform[]>(() => {
	const { translate, scale, rotate } = props
	const transforms: Transform[] = []

	if (translate) transforms.push({ type: 'translate', ...translate })
	if (scale) transforms.push({ type: 'scale', ...scale })
	if (rotate) transforms.push({ type: 'rotation', ...rotate })

	return transforms
})

const combinedTransforms = computed<Transform[]>(() => {
	const parent = parentTransforms ? toValue(parentTransforms) : []

	return [...parent, ...toValue(localTransforms)]
})

provide(CANVAS_TOKENS.TRANSFORMS, combinedTransforms)
</script>
