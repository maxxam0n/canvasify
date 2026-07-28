<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TextShape, type TextParams } from '@maxxam0n/canvasify-core'

import {
	omitShapeInteractionProps,
	shapeInteractionDefaults,
	useShapeInteractionOptions,
} from '../../lib/shape-interaction.utils'
import type { ShapeInteractionProps } from '../../lib/use-shape.types'
import { useShape } from '../../lib/use-shape'

defineSlots<{ default?: () => unknown }>()

const props = withDefaults(
	defineProps<TextParams & ShapeInteractionProps>(),
	shapeInteractionDefaults,
)

useShape(
	computed(() => new TextShape(omitShapeInteractionProps(props))),
	useShapeInteractionOptions(props),
)
</script>
