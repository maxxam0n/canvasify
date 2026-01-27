<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RectShape, type RectParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<RectParams>()

useShape(computed(() => new RectShape(props)))
</script>
