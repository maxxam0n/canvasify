<template></template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { computed, inject, onUnmounted, shallowRef, watch } from 'vue'
import type { BaseShape, Layer, Particle } from '@maxxam0n/canvasify-core'
import {
	createRadialParticles,
	drawParticles as drawParticlesLib,
	stepParticlesInPlace,
} from '@maxxam0n/canvasify-core'

import { CANVAS_TOKENS } from '../../lib/tokens'
import { useShape } from '../../lib/use-shape'
import type { ParticleProps } from './Particle.types'

const props = withDefaults(defineProps<ParticleProps>(), {
	particleCount: 15,
	duration: 1500,
})

const DEFAULT_COLORS = ['#ff4500', '#ff8c00', '#ffd700', '#ff6347']

const layer = inject<ComputedRef<Layer | null>>(CANVAS_TOKENS.LAYER)

const particles = shallowRef<Particle[]>(
	createRadialParticles({
		cx: props.cx,
		cy: props.cy,
		count: props.particleCount,
		colors: props.colors?.length ? props.colors : DEFAULT_COLORS,
	}),
)

let frameId: number | null = null
let completed = false
let startTime: number | null = null
let prevTime: number | null = null

const complete = () => {
	if (completed) return
	completed = true
	if (frameId !== null) cancelAnimationFrame(frameId)
	frameId = null
	props.onComplete(props.id)
}

const stepParticles = (timestamp: number) => {
	if (startTime === null) startTime = timestamp
	if (prevTime === null) prevTime = timestamp

	const elapsed = timestamp - startTime
	const dt = timestamp - prevTime
	prevTime = timestamp

	stepParticlesInPlace(particles.value, dt)
	layer?.value?.makeDirty()

	if (elapsed >= props.duration || particles.value.length === 0) {
		complete()
		return
	}

	frameId = requestAnimationFrame(stepParticles)
}

const restart = () => {
	if (frameId !== null) cancelAnimationFrame(frameId)
	frameId = null
	completed = false
	startTime = null
	prevTime = null

	particles.value = createRadialParticles({
		cx: props.cx,
		cy: props.cy,
		count: props.particleCount,
		colors: props.colors?.length ? props.colors : DEFAULT_COLORS,
	})
	layer?.value?.makeDirty()
	frameId = requestAnimationFrame(stepParticles)
}

watch(
	() => [props.cx, props.cy, props.particleCount, props.duration, props.id, props.colors],
	() => restart(),
	{ immediate: true },
)

const drawParticles = (ctx: CanvasRenderingContext2D) => {
	drawParticlesLib(ctx, particles.value)
}

const shape = computed<BaseShape>(() => ({
	draw: drawParticles,
	shapeParams: { opacity: 1, zIndex: 0 },
	meta: {},
}))

useShape(shape)

onUnmounted(() => {
	if (frameId !== null) {
		cancelAnimationFrame(frameId)
	}
})
</script>
