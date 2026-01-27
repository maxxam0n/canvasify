<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LineShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { LineProps } from './Line.types'

const props = defineProps<LineProps>()

useShape(computed(() => new LineShape(props)))
</script>
