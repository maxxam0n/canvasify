<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PolygonShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { PolygonProps } from './Polygon.types'

const props = defineProps<PolygonProps>()

useShape(computed(() => new PolygonShape(props)))
</script>
