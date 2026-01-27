<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TextShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'
import type { TextProps } from './Text.types'

const props = defineProps<TextProps>()

useShape(computed(() => new TextShape(props)))
</script>
