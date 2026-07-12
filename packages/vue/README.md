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
- **Animation**: Animation via reactive prop updates (see BounceIn example)
- **TypeScript**: Full TypeScript support
- **Provide/Inject**: Automatic canvas and layer management through Vue's provide/inject
- **Pointer events**: Eight shape emits via core `createPointerInteraction`
- **Shape interaction**: `listening`, `cursor`, `hitStrokeWidth` on shapes and `useShape`
- **Draw effects**: `shadowColor` / `shadowBlur` / `shadowOffsetX` / `shadowOffsetY`, `globalCompositeOperation`
- **Transforms**: `translate`, `scale`, `rotate`, `skew`, `matrix`, `clipRect` on `Transform`
- **Paint**: CSS color, gradients, and `{ type: 'pattern', image, repetition? }` on shape fills/strokes
- **Text**: `\n`, `wrap`, `lineHeight` (core layout; same as `layoutTextLines`)

## Usage

### Basic Example

```vue
<template>
	<Canvas :width="800" :height="600" background="#f0f0f0">
		<Layer name="main">
			<Rect :x="10" :y="10" :width="100" :height="50" fill-color="blue" />
			<Circle :cx="150" :cy="75" :radius="30" fill-color="red" />
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
			<Group :x="100" :y="100">
				<Transform
					:rotate="{ angle: (45 * Math.PI) / 180 }"
					:skew="{ skewX: 0.2, skewY: 0 }"
				>
					<Rect :width="50" :height="50" fill-color="green" />
				</Transform>
			</Group>
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { Canvas, Layer, Group, Transform, Rect } from '@maxxam0n/canvasify-vue'
</script>
```

`matrix` accepts `{ a, b, c, d, e, f }` (same as `CanvasRenderingContext2D.transform`). Nested transforms compose; hit-test inverts the stack.

### Draw effects and pattern paint

Shadow and composite props are available on every shape (and on `useShape` options), same as core `DrawEffects`:

```vue
<Rect
	:x="10"
	:y="10"
	:width="80"
	:height="40"
	:fill-color="{ type: 'pattern', image: tileImage, repetition: 'repeat' }"
	shadow-color="rgba(0,0,0,0.35)"
	:shadow-blur="6"
	:shadow-offset-x="2"
	:shadow-offset-y="3"
	global-composite-operation="multiply"
/>
```

Non-`source-over` composites force a full layer dirty redraw in core.

### Text wrap

```vue
<script setup lang="ts">
const label = 'Hello\nworld'
</script>

<template>
	<Text
		:x="20"
		:y="40"
		:text="label"
		font="16px sans-serif"
		fill-color="#111"
		:wrap="true"
		:max-width="120"
		:line-height="22"
	/>
</template>
```

Hard breaks use `\n`; with `wrap` + `maxWidth`, words wrap; `lineHeight` defaults to `fontSize * 1.2`.

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

### Shape Pointer Events

`Canvas` wires core `PointerInteraction` and emits shape events in logical canvas coordinates. Each event payload is a `ShapePointerEvent` (`x`, `y`, `nativeEvent`, `hit`) or `ShapeWheelEvent` for wheel.

```vue
<template>
	<Canvas
		:width="400"
		:height="300"
		@shape-pointer-down="onDown"
		@shape-pointer-move="onMove"
		@shape-pointer-up="onUp"
		@shape-pointer-enter="onEnter"
		@shape-pointer-leave="onLeave"
		@shape-pointer-cancel="onCancel"
		@shape-wheel="onWheel"
		@shape-click="onClick"
	>
		<Layer name="main">
			<Rect :x="50" :y="50" :width="100" :height="80" fill-color="blue" cursor="pointer" />
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import type { ShapePointerEvent, ShapeWheelEvent } from '@maxxam0n/canvasify-vue'
import { Canvas, Layer, Rect } from '@maxxam0n/canvasify-vue'

const onDown = (event: ShapePointerEvent) => console.log('down', event.hit.shapeId)
const onMove = (event: ShapePointerEvent) => {}
const onUp = (event: ShapePointerEvent) => {}
const onEnter = (event: ShapePointerEvent) => {}
const onLeave = (event: ShapePointerEvent) => {}
const onCancel = (event: ShapePointerEvent) => {}
const onWheel = (event: ShapeWheelEvent) => {}
const onClick = (event: ShapePointerEvent) => {}
</script>
```

**Canvas emits** (template: kebab-case, e.g. `@shape-pointer-down`):

| Emit | Template | When |
|------|----------|------|
| `shapePointerDown` | `@shape-pointer-down` | pointerdown on a shape |
| `shapePointerMove` | `@shape-pointer-move` | pointermove over a shape |
| `shapePointerUp` | `@shape-pointer-up` | pointerup over a shape |
| `shapePointerEnter` | `@shape-pointer-enter` | cursor entered a shape |
| `shapePointerLeave` | `@shape-pointer-leave` | cursor left a shape |
| `shapePointerCancel` | `@shape-pointer-cancel` | pointercancel on a shape |
| `shapeWheel` | `@shape-wheel` | wheel over a shape |
| `shapeClick` | `@shape-click` | click (down+up on the same shape) |

Payload: `ShapePointerEvent` or `ShapeWheelEvent` from `@maxxam0n/canvasify-core` (re-exported by this package) — `x`, `y`, `nativeEvent`, `hit`.

### Shape Interaction Props

All shape components accept optional interaction and draw-effect props:

| Prop | Default | Effect |
|------|---------|--------|
| `listening` | `true` | `false` skips hit-test |
| `cursor` | — | CSS cursor on hover |
| `hitStrokeWidth` | — | Extra stroke hit padding on **Rect, Circle, Ellipse** |
| `shadowColor` / `shadowBlur` / `shadowOffsetX` / `shadowOffsetY` | — | Canvas shadow |
| `globalCompositeOperation` | — | Canvas composite mode |

```vue
<Rect
	:x="10"
	:y="10"
	:width="100"
	:height="50"
	fill-color="blue"
	:listening="true"
	cursor="pointer"
	:hit-stroke-width="8"
	shadow-color="rgba(0,0,0,0.3)"
	:shadow-blur="4"
/>
```

### Image Load Errors

`Image` forwards `onError` from core `ImageParams`:

```vue
<Image
	src="/missing.png"
	:on-error="err => console.error('Image failed', err.message)"
/>
```

### Using the useShape Composable

`useShape` accepts `ComputedRef<BaseShape | null>` and an optional second argument with interaction options (`listening`, `cursor`, `hitStrokeWidth`). The component calling `useShape` must be a descendant of `Layer`.

```vue
<template>
	<Canvas :width="800" :height="600">
		<Layer name="main">
			<Rect :x="10" :y="10" :width="100" :height="50" fill-color="blue" />
			<ProgrammaticRect />
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { computed, defineComponent } from 'vue'
import { Canvas, Layer, Rect, useShape } from '@maxxam0n/canvasify-vue'
import { RectShape } from '@maxxam0n/canvasify-core'

const ProgrammaticRect = defineComponent({
	setup() {
		const shape = computed(
			() => new RectShape({ x: 150, y: 10, width: 80, height: 50, fillColor: 'red' }),
		)
		useShape(shape, computed(() => ({ cursor: 'pointer' })))
		return () => null
	},
})
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

**Events:** `shapePointerDown`, `shapePointerMove`, `shapePointerUp`, `shapePointerEnter`, `shapePointerLeave`, `shapePointerCancel`, `shapeWheel`, `shapeClick` — see [Shape Pointer Events](#shape-pointer-events).

**Exposed Methods:**

- `getCore()` - Get the underlying Canvas instance
- `getLayer(name: string)` - Get a layer by name

### Layer

Represents a canvas layer. Must be a child of `Canvas`.

**Props:**

- `name: string` - Unique layer identifier
- `opacity?: number` - Layer opacity (default `1`)
- `zIndex?: number` - Stacking order (default `0`)
- `renderer?: RenderLayer` - Optional custom layer renderer (incompatible with `workerRenderer`)
- `spatialIndex?: boolean | { cellSize?: number; threshold?: number }` - Hit-test spatial index (core defaults: enabled, `threshold: 64`, `cellSize: 32`). Passed at construction; changing this prop remounts the layer.
- `workerRenderer?: LayerWorkerRendererOptions` - **Experimental:** paint via `OffscreenCanvas` + Web Worker. Passed at construction; changing this prop remounts the layer. Prefer a stable `createWorker` / `port` reference (module-level or `shallowRef`).

#### Experimental Worker paint

Opt-in layer paint via `OffscreenCanvas` + Web Worker. Hit-test stays on the main thread. Shape components / `useShape` pass `{ source }` automatically.

```vue
<template>
	<Canvas :width="800" :height="600">
		<Layer name="main" :worker-renderer="workerRenderer">
			<Rect :x="10" :y="10" :width="100" :height="50" fill-color="blue" />
		</Layer>
	</Canvas>
</template>

<script setup lang="ts">
import { Canvas, Layer, Rect } from '@maxxam0n/canvasify-vue'
import type { LayerWorkerRendererOptions } from '@maxxam0n/canvasify-core'

const workerRenderer: LayerWorkerRendererOptions = {
	createWorker: () =>
		new Worker(new URL('@maxxam0n/canvasify-core/render-worker', import.meta.url)),
}
</script>
```

**Limitations (v1):** requires `OffscreenCanvas` / `transferControlToOffscreen`; incompatible with custom `renderer`; Image / Text / PatternPaint unsupported in worker snapshots; `cache()` / `setStatic(true)` / `toDataURL()` / `toBlob()` throw in worker mode. See `@maxxam0n/canvasify-core` README for full details.

### Group

Container for grouping shapes together.

### Transform

Applies transformations to its children.

**Props:**

- `translate?: { translateX: number; translateY: number }` - Translation
- `scale?: { scaleX: number; scaleY: number; originX?: number; originY?: number }` - Scale
- `rotate?: { angle: number; originX?: number; originY?: number }` - Rotation (angle in radians)
- `skew?: { skewX: number; skewY: number; originX?: number; originY?: number }` - Shear (radians)
- `matrix?: { a: number; b: number; c: number; d: number; e: number; f: number }` - Affine matrix
- `clipRect?: { x: number; y: number; width: number; height: number }` - Clip in local space

`Group` accepts `x`, `y` and passes them to `Transform` as `translate`.

### Shape Components

- `Circle` - Circular shapes
- `Ellipse` - Elliptical shapes
- `Rect` - Rectangles
- `Polygon` - Polygons
- `Line` - Lines
- `Text` - Text (`wrap`, `lineHeight`, `\n`; see core `TextParams` / `layoutTextLines`)
- `Image` - Images
- `Path` - Path commands

Each shape component accepts props matching the corresponding shape parameters from `@maxxam0n/canvasify-core` (including pattern/gradient paints), plus optional `listening`, `cursor`, `hitStrokeWidth`, and DrawEffects props.

> **Performance note:** `Layer` enables a spatial hit-test index automatically at 64+ shapes (`spatialIndex` prop; defaults from core). Bitmap `cache()` / `setStatic()` are available via the core layer handle (`defineExpose` / `getCore()`).

## Composables

### useShape

Composable for programmatically creating shapes. Accepts `ComputedRef<BaseShape | null>` and optional `ComputedRef<UseShapeOptions>`. The component must be a descendant of `Layer`.

```typescript
const shape = computed(
	() => new RectShape({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' }),
)
const interaction = computed(() => ({
	listening: true,
	cursor: 'pointer',
	shadowColor: 'rgba(0,0,0,0.3)',
	shadowBlur: 4,
}))
useShape(shape, interaction)
```

### Context Composables

Composables for injecting canvas context via Vue's provide/inject. Use them inside `Canvas` / `Layer` / `Group` / `Transform` to access the current context.

| Composable | Returns | Description |
|------------|---------|-------------|
| `useCurrentLayer` | `ComputedRef<Layer \| null>` | Layer instance where shapes are drawn |
| `useCurrentCanvas` | `Canvas \| undefined` | Root Canvas instance |
| `useCanvasSize` | `ComputedRef<{ width, height } \| null>` | Canvas dimensions |
| `useCurrentGroup` | `ComputedRef<GroupParams>` | Current group params (opacity, zIndex) |
| `useCurrentTransforms` | `ComputedRef<Transform[]>` | Stack of transforms applied to children |

```vue
<template>
	<div v-if="layer">Layer: {{ layer.name }}, shapes: {{ layer.shapes.size }}</div>
</template>

<script setup lang="ts">
import { useCurrentLayer } from '@maxxam0n/canvasify-vue'

const layer = useCurrentLayer()
</script>
```

## License

MIT
