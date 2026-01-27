<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PolygonShape, type PolygonParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<PolygonParams>()

useShape(computed(() => new PolygonShape(props)))
</script>
