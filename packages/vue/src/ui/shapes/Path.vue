<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PathShape, type PathParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../lib/use-shape'

const props = defineProps<PathParams>()

useShape(computed(() => new PathShape(props)))
</script>
