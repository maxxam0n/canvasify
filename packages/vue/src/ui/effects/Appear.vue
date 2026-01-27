<template>
	<Group :x="x" :y="y">
		<Transform
			:scale="{
				scaleX: scale,
				scaleY: scale,
				originX: originX,
				originY: originY,
			}"
		>
			<slot />
		</Transform>
	</Group>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import Group from '../Group.vue'
import Transform from '../Transform.vue'
import type { AppearProps } from './Appear.types'

const props = defineProps<AppearProps>()

const scale = ref(0)

const originX = computed(() => props.width / 2)
const originY = computed(() => props.height / 2)

let animationFrameId: number | null = null

onMounted(() => {
	let startTime: number | null = null

	const animate = (timestamp: number) => {
		if (startTime === null) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / props.duration, 1)

		// Кастомная функция для "пружинного" эффекта
		// t < 0.4: быстрый рост до 1.2
		// t >= 0.4: затухающее колебание вокруг 1.0
		if (progress < 0.4) {
			scale.value = (progress / 0.4) * 1.2
		} else {
			const bounceProgress = (progress - 0.4) / 0.6
			// Формула для эффекта "отскока"
			const newScale = 1 + 0.2 * Math.exp(-6 * bounceProgress) * Math.cos(10 * bounceProgress)
			scale.value = newScale
		}

		if (progress < 1) {
			animationFrameId = requestAnimationFrame(animate)
		} else {
			scale.value = 1
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
