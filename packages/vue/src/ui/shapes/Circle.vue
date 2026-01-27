<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleShape, type CircleParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<CircleParams>()

useShape(computed(() => new CircleShape(props)))
</script>
