<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ImageShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { ImageProps } from './Image.types'

const props = defineProps<ImageProps>()

useShape(computed(() => new ImageShape(props)))
</script>
