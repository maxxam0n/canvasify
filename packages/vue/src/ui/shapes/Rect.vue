<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RectShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { RectProps } from './Rect.types'

const props = defineProps<RectProps>()

useShape(computed(() => new RectShape(props)))
</script>
