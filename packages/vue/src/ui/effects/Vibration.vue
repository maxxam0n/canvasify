<template>
	<Group :x="x" :y="y">
		<Transform :translate="{ translateX: xOffset, translateY: 0 }">
			<slot />
		</Transform>
	</Group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import Group from '../Group.vue'
import Transform from '../Transform.vue'
import type { VibrationProps } from './Vibration.types'

const props = withDefaults(defineProps<VibrationProps>(), {
	amplitude: 3,
})

const xOffset = ref(0)

let animationFrameId: number | null = null

onMounted(() => {
	let startTime: number | null = null

	const animate = (timestamp: number) => {
		if (startTime === null) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / props.duration, 1)

		// Формула для быстрого затухающего колебания
		const shake = Math.sin(progress * Math.PI * 6) * (1 - progress) * props.amplitude
		xOffset.value = shake

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
