<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TextShape, type TextParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<TextParams>()

useShape(computed(() => new TextShape(props)))
</script>
