<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { CircleProps } from './Circle.types'

const props = defineProps<CircleProps>()

useShape(computed(() => new CircleShape(props)))
</script>
