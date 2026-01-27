<template>
	<Transform :translate="{ translateX: x, translateY: y }">
		<slot />
	</Transform>
</template>

<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import { computed, inject, provide } from 'vue'
import type { GroupParams } from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../lib/tokens'

import Transform from './Transform.vue'
import type { GroupProps } from './Group.types'

const props = withDefaults(defineProps<GroupProps>(), {
	x: 0,
	y: 0,
	opacity: 1,
	zIndex: 0,
})

const parentGroupParams = inject<ComputedRef<GroupParams>>(
	CANVAS_TOKENS.GROUP,
	computed(() => ({ opacity: 1, zIndex: 0 })),
)

const groupParams = computed<GroupParams>(() => ({
	opacity: props.opacity * (parentGroupParams?.value.opacity ?? 1),
	zIndex: props.zIndex + (parentGroupParams?.value.zIndex ?? 0),
}))

provide(CANVAS_TOKENS.GROUP, groupParams)
</script>
