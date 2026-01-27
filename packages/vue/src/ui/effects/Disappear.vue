<template>
	<Group :x="x" :y="y" :opacity="animState.opacity">
		<Transform
			:translate="{
				translateX: 0,
				translateY: animState.yOffset,
			}"
		>
			<slot />
		</Transform>
	</Group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import Group from '../Group.vue'
import Transform from '../Transform.vue'
import type { DisappearProps } from './Disappear.types'

const props = defineProps<DisappearProps>()

const animState = ref({ yOffset: 0, opacity: 1 })

let animationFrameId: number | null = null

onMounted(() => {
	let startTime: number | null = null

	const animate = (timestamp: number) => {
		if (startTime === null) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / props.duration, 1)

		animState.value = {
			yOffset: -progress * props.amplitude, // Улетает на половину своего размера
			opacity: 1 - progress,
		}

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
