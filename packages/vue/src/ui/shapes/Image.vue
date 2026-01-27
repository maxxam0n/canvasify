<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ImageShape, type ImageParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<ImageParams>()

useShape(computed(() => new ImageShape(props)))
</script>
