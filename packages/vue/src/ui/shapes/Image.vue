<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ImageShape, type ImageParams } from '@maxxam0n/canvasify-core'

import {
	omitShapeInteractionProps,
	shapeInteractionDefaults,
	useShapeInteractionOptions,
} from '../../lib/shape-interaction.utils'
import type { ShapeInteractionProps } from '../../lib/use-shape.types'
import { useShape } from '../../lib/use-shape'

const props = withDefaults(defineProps<ImageParams & ShapeInteractionProps>(), shapeInteractionDefaults)

useShape(
	computed(() => new ImageShape(omitShapeInteractionProps(props))),
	useShapeInteractionOptions(props),
)
</script>
