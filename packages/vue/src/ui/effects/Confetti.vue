<template>
	<Group :x="x" :y="y">
		<ParticleEffect
			:id="`${props.id}-confetti`"
			:cx="props.size / 2"
			:cy="props.size / 2"
			:duration="duration"
			:particle-count="power"
			:colors="colors"
			:on-complete="() => onComplete(props.id)"
		/>
	</Group>
</template>

<script setup lang="ts">
import Group from '../Group.vue'

import ParticleEffect from './Particle.vue'
import type { ConfettiProps } from './Confetti.types'

const props = withDefaults(defineProps<ConfettiProps>(), {
	power: 12,
})

const colors = ['#ff4d4f', '#ffa940', '#ffec3d', '#52c41a', '#1890ff', '#9254de']
</script>
