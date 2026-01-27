<template>
	<Group :x="x" :y="y">
		<slot name="background" />

		<VibrationEffect
			:id="`${props.id}-vibration`"
			:x="0"
			:y="0"
			:duration="duration"
			:on-complete="() => {}"
		>
			<slot />
		</VibrationEffect>

		<ParticleEffect
			:id="`${props.id}-particles`"
			:cx="props.size / 2"
			:cy="props.size / 2"
			:duration="2000"
			:particle-count="power"
			:on-complete="() => onComplete(props.id)"
		/>
	</Group>
</template>

<script setup lang="ts">
import Group from '../Group.vue'

import ParticleEffect from './Particle.vue'
import VibrationEffect from './Vibration.vue'
import type { ExplosionProps } from './Explosion.types'

const props = withDefaults(defineProps<ExplosionProps>(), {
	power: 10,
})
</script>
