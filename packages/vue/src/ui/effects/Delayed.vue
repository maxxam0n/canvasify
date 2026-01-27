<template>
	<slot v-if="!isWaiting" />
	<slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { DelayedProps } from './Delayed.types'

const props = defineProps<DelayedProps>()

const isWaiting = ref(true)

let timerId: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
	if (props.delay <= 0) {
		isWaiting.value = false
		return
	}

	timerId = setTimeout(() => {
		isWaiting.value = false // Задержка прошла, переключаем на основную анимацию
	}, props.delay)
})

onUnmounted(() => {
	if (timerId !== null) {
		clearTimeout(timerId)
	}
})
</script>
