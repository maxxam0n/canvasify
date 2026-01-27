<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EllipseShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { EllipseProps } from './Ellipse.types'

const props = defineProps<EllipseProps>()

useShape(computed(() => new EllipseShape(props)))
</script>
