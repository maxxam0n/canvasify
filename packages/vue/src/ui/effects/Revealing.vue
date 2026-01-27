<template>
	<Group :x="x" :y="y" :opacity="opacity">
		<slot />
	</Group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import Group from '../Group.vue'
import type { RevealingProps } from './Revealing.types'

const props = defineProps<RevealingProps>()

const opacity = ref(1)

let animationFrameId: number | null = null

onMounted(() => {
	let startTime: number | null = null

	const animate = (timestamp: number) => {
		if (startTime === null) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / (props.duration * 0.5), 1)

		// Плавное исчезновение
		opacity.value = 1 - progress

		if (progress < 1) {
			animationFrameId = requestAnimationFrame(animate)
		} else {
			props.onComplete(props.id)
		}
	}

	animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
	}
})
</script>
