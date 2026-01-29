# @maxxam0n/canvasify-vue

Vue components for Canvasify - declarative canvas rendering for Vue 3 applications.

## Installation

```bash
npm install @maxxam0n/canvasify-vue
```

## Peer Dependencies

- Vue >= 3.0.0

## Features

- **Declarative API**: Use Vue components to define canvas elements
- **Composition API**: Built with Vue 3 Composition API
- **Animation Effects**: Built-in animation and effect components
- **TypeScript**: Full TypeScript support
- **Provide/Inject**: Automatic canvas and layer management through Vue's provide/inject

## Usage

### Basic Example

```vue
<template>
	<Canvas :width="800" :height="600" background="#f0f0f0">
		<Layer name="main">
			<Rect :x="10" :y="10" :width="100" :height="50" fill="blue" />
			<Circle :x="150" :y="75" :radius="30" fill="red" />
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { Canvas, Layer, Rect, Circle } from '@maxxam0n/canvasify-vue'
</script>
```

### Using Groups and Transforms

```vue
<template>
	<Canvas :width="800" :height="600">
		<Layer name="main">
			<Group>
				<Transform :x="100" :y="100" :rotation="45">
					<Rect :width="50" :height="50" fill="green" />
				</Transform>
			</Group>
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { Canvas, Layer, Group, Transform, Rect } from '@maxxam0n/canvasify-vue'
</script>
```

### Animated Figures

Animation is driven by reactively updating props (e.g. `scale` on `Transform`) and `requestAnimationFrame`. Example of a custom spring-style appear effect:

```vue
<template>
	<Group :x="x" :y="y">
		<Transform
			:scale="{
				scaleX: scale,
				scaleY: scale,
				originX: originX,
				originY: originY,
			}"
		>
			<slot />
		</Transform>
	</Group>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { Group, Transform } from '@maxxam0n/canvasify-vue'

interface Props {
	x?: number
	y?: number
	width: number
	height: number
	duration?: number
	onComplete?: (id?: string) => void
	id?: string
}

const props = withDefaults(defineProps<Props>(), {
	x: 0,
	y: 0,
	duration: 600,
})

const scale = ref(0)
const originX = computed(() => props.width / 2)
const originY = computed(() => props.height / 2)

let animationFrameId: number | null = null

onMounted(() => {
	let startTime: number | null = null

	const animate = (timestamp: number) => {
		if (startTime === null) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / props.duration, 1)

		if (progress < 0.4) {
			scale.value = (progress / 0.4) * 1.2
		} else {
			const bounceProgress = (progress - 0.4) / 0.6
			scale.value = 1 + 0.2 * Math.exp(-6 * bounceProgress) * Math.cos(10 * bounceProgress)
		}

		if (progress < 1) {
			animationFrameId = requestAnimationFrame(animate)
		} else {
			scale.value = 1
			props.onComplete?.(props.id)
		}
	}

	animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
	}
})
</script>
```

Usage: wrap any shape in this component, pass `width`/`height` (for the scale origin) and optionally `duration`, `onComplete`, `id`.

### Using Animation Effects

```vue
<template>
	<Canvas :width="800" :height="600">
		<Layer name="main">
			<AppearEffect :duration="1000">
				<Rect :width="100" :height="100" fill="blue" />
			</AppearEffect>

			<ConfettiEffect>
				<Circle :radius="20" fill="red" />
			</ConfettiEffect>

			<ExplosionEffect>
				<Rect :width="50" :height="50" fill="green" />
			</ExplosionEffect>
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import {
	Canvas,
	Layer,
	Rect,
	Circle,
	AppearEffect,
	ConfettiEffect,
	ExplosionEffect,
} from '@maxxam0n/canvasify-vue'
</script>
```

### Using the useShape Composable

```vue
<template>
	<Canvas :width="800" :height="600">
		<Layer name="main">
			<!-- Shape is registered and rendered automatically -->
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Canvas, Layer, useShape } from '@maxxam0n/canvasify-vue'
import { RectShape, type RectParams } from '@maxxam0n/canvasify-core'

const props = { x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' as const }
useShape(computed(() => new RectShape(props as RectParams)))
</script>
```

### Custom Shape via useShape

Implement a custom shape as a class (or object) that implements `BaseShape` from `@maxxam0n/canvasify-core`: it must provide `draw(ctx)`, `shapeParams` (`zIndex`, `opacity`) and `meta`. Use the `useShape` composable with a `computed` that returns your shape instance, and use the component inside a layer like any other shape.

```vue
<template>
	<Canvas :width="400" :height="300">
		<Layer name="main">
			<Rect :x="50" :y="50" :width="80" :height="80" fill-color="lightblue" />
			<StarShape :cx="200" :cy="150" :radius="40" fill-color="gold" />
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { computed, defineComponent } from 'vue'
import type { BaseShape, ShapeParams } from '@maxxam0n/canvasify-core'
import { Canvas, Layer, Rect, useShape } from '@maxxam0n/canvasify-vue'

interface StarShapeParams {
	cx: number
	cy: number
	radius: number
	fillColor?: string
	opacity?: number
	zIndex?: number
}

class StarShapeImpl implements BaseShape {
	constructor(private params: StarShapeParams) {}

	draw(ctx: CanvasRenderingContext2D) {
		const { cx, cy, radius, fillColor } = this.params
		if (!fillColor) return

		ctx.fillStyle = fillColor
		ctx.beginPath()
		for (let i = 0; i < 10; i++) {
			const r = i % 2 === 0 ? radius : radius * 0.4
			const a = (i * Math.PI) / 5 - Math.PI / 2
			const x = cx + r * Math.cos(a)
			const y = cy + r * Math.sin(a)
			if (i === 0) ctx.moveTo(x, y)
			else ctx.lineTo(x, y)
		}
		ctx.closePath()
		ctx.fill()
	}

	get shapeParams(): ShapeParams {
		return {
			zIndex: this.params.zIndex ?? 0,
			opacity: this.params.opacity ?? 1,
		}
	}

	get meta() {
		return { ...this.params }
	}
}

const StarShape = defineComponent({
	name: 'StarShape',
	props: {
		cx: { type: Number, default: 0 },
		cy: { type: Number, default: 0 },
		radius: { type: Number, default: 30 },
		fillColor: { type: String, default: 'gold' },
		opacity: { type: Number, default: 1 },
		zIndex: { type: Number, default: 0 },
	},
	setup(props) {
		const shape = computed(
			() =>
				new StarShapeImpl({
					cx: props.cx,
					cy: props.cy,
					radius: props.radius,
					fillColor: props.fillColor,
					opacity: props.opacity,
					zIndex: props.zIndex,
				}),
		)
		useShape(shape)
	},
	render: () => null,
})
</script>
```

## Components

### Canvas

Root component that creates a canvas container.

**Props:**

- `width?: number` - Canvas width (default: 500)
- `height?: number` - Canvas height (default: 300)
- `background?: string` - Background color (default: 'transparent')

**Exposed Methods:**

- `getCore()` - Get the underlying Canvas instance
- `getLayer(name: string)` - Get a layer by name

### Layer

Represents a canvas layer. Must be a child of `Canvas`.

**Props:**

- `name: string` - Unique layer identifier

### Group

Container for grouping shapes together.

### Transform

Applies transformations to its children.

**Props:**

- `x?: number` - X translation
- `y?: number` - Y translation
- `rotation?: number` - Rotation in degrees
- `scaleX?: number` - X scale factor
- `scaleY?: number` - Y scale factor

### Shape Components

- `Circle` - Circular shapes
- `Ellipse` - Elliptical shapes
- `Rect` - Rectangles
- `Polygon` - Polygons
- `Line` - Lines
- `Text` - Text
- `Image` - Images

Each shape component accepts props matching the corresponding shape parameters from `@maxxam0n/canvasify-core`.

### Effect Components

- `AppearEffect` - Fade-in animation
- `DisappearEffect` - Fade-out animation
- `ConfettiEffect` - Confetti particle effect
- `ExplosionEffect` - Explosion particle effect
- `RevealingEffect` - Reveal animation
- `VibrationEffect` - Vibration/shake effect
- `DelayedAnimation` - Delay before animation
- `ParticleEffect` - Custom particle effect

## Composables

### useShape

Composable for programmatically creating and managing shapes within a layer context.

```typescript
const shape = useShape<ShapeParams>(params)
```

## License

MIT
