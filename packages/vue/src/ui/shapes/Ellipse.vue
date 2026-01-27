<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EllipseShape, type EllipseParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<EllipseParams>()

useShape(computed(() => new EllipseShape(props)))
</script>
