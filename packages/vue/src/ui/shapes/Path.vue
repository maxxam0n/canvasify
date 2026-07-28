<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PathShape, type PathParams } from '@maxxam0n/canvasify-core'

import {
	omitShapeInteractionProps,
	shapeInteractionDefaults,
	useShapeInteractionOptions,
} from '../../lib/shape-interaction.utils'
import type { ShapeInteractionProps } from '../../lib/use-shape.types'
import { useShape } from '../../lib/use-shape'

defineSlots<{ default?: () => unknown }>()

const props = withDefaults(
	defineProps<PathParams & ShapeInteractionProps>(),
	shapeInteractionDefaults,
)

useShape(
	computed(() => new PathShape(omitShapeInteractionProps(props))),
	useShapeInteractionOptions(props),
)
</script>
