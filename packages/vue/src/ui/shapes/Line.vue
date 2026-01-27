<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LineShape, type LineParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<LineParams>()

useShape(computed(() => new LineShape(props)))
</script>
