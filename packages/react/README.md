# @maxxam0n/canvasify-react

React components for Canvasify - declarative canvas rendering for React applications.

## Installation

```bash
npm install @maxxam0n/canvasify-react
```

## Peer Dependencies

- React >= 18.0.0
- React DOM >= 18.0.0

## Features

- **Declarative API**: Use React components to define canvas elements
- **Context-based**: Automatic canvas and layer management through React Context
- **TypeScript**: Full TypeScript support
- **Hooks**: Custom hooks for shape management
- **Pointer events**: Eight shape handlers via core `createPointerInteraction`
- **Shape interaction**: `listening`, `cursor`, `hitStrokeWidth` on shapes and `useShape`
- **Draw effects**: `shadowColor` / `shadowBlur` / `shadowOffsetX` / `shadowOffsetY`, `globalCompositeOperation`
- **Transforms**: `translate`, `scale`, `rotate`, `skew`, `matrix`, `clipRect` on `Transform`
- **Paint**: CSS color, gradients, and `{ type: 'pattern', image, repetition? }` on shape fills/strokes
- **Text**: `\n`, `wrap`, `lineHeight` (core layout; same as `layoutTextLines`)

## Usage

### Basic Example

```tsx
import { Canvas, Layer, Rect, Circle } from '@maxxam0n/canvasify-react'

function App() {
	return (
		<Canvas width={800} height={600} background="#f0f0f0">
			<Layer name="main">
				<Rect x={10} y={10} width={100} height={50} fillColor="blue" />
				<Circle cx={150} cy={75} radius={30} fillColor="red" />
			</Layer>
		</Canvas>
	)
}
```

### Using Groups and Transforms

```tsx
import { Canvas, Layer, Group, Transform, Rect } from '@maxxam0n/canvasify-react'

function App() {
	return (
		<Canvas width={800} height={600}>
			<Layer name="main">
				<Group x={100} y={100}>
					<Transform
						rotate={{ angle: (45 * Math.PI) / 180 }}
						skew={{ skewX: 0.2, skewY: 0 }}
					>
						<Rect width={50} height={50} fillColor="green" />
					</Transform>
				</Group>
			</Layer>
		</Canvas>
	)
}
```

`matrix` accepts `{ a, b, c, d, e, f }` (same as `CanvasRenderingContext2D.transform`). Nested transforms compose; hit-test inverts the stack.

### Draw effects and pattern paint

Shadow and composite props sit next to interaction props on every shape (and on `useShape` options):

```tsx
<Rect
	x={10}
	y={10}
	width={80}
	height={40}
	fillColor={{ type: 'pattern', image: tileImage, repetition: 'repeat' }}
	shadowColor="rgba(0,0,0,0.35)"
	shadowBlur={6}
	shadowOffsetX={2}
	shadowOffsetY={3}
	globalCompositeOperation="multiply"
/>
```

Non-`source-over` composites force a full layer dirty redraw in core.

### Text wrap

```tsx
<Text
	x={20}
	y={40}
	text={'Hello\nworld'}
	font="16px sans-serif"
	fillColor="#111"
	wrap
	maxWidth={120}
	lineHeight={22}
/>
```

### Animated Figures

Animation is driven by updating props (e.g. `scale` on `Transform`) in a `requestAnimationFrame` loop. Example of a spring-style appear effect:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Canvas, Layer, Group, Transform, Rect } from '@maxxam0n/canvasify-react'

interface BounceInProps {
	x?: number
	y?: number
	width: number
	height: number
	duration?: number
	children: React.ReactNode
}

function BounceIn({ x = 0, y = 0, width, height, duration = 600, children }: BounceInProps) {
	const [scale, setScale] = useState(0)
	const rafRef = useRef<number | null>(null)
	const startRef = useRef<number | null>(null)

	const originX = width / 2
	const originY = height / 2

	useEffect(() => {
		const animate = (timestamp: number) => {
			if (startRef.current === null) startRef.current = timestamp
			const elapsed = timestamp - startRef.current
			const progress = Math.min(elapsed / duration, 1)

			if (progress < 0.4) {
				setScale((progress / 0.4) * 1.2)
			} else {
				const bounceProgress = (progress - 0.4) / 0.6
				setScale(1 + 0.2 * Math.exp(-6 * bounceProgress) * Math.cos(10 * bounceProgress))
			}

			if (progress < 1) {
				rafRef.current = requestAnimationFrame(animate)
			} else {
				setScale(1)
			}
		}

		rafRef.current = requestAnimationFrame(animate)
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
		}
	}, [duration])

	return (
		<Group x={x} y={y}>
			<Transform
				scale={{
					scaleX: scale,
					scaleY: scale,
					originX,
					originY,
				}}
			>
				{children}
			</Transform>
		</Group>
	)
}

function App() {
	return (
		<Canvas width={800} height={600}>
			<Layer name="main">
				<BounceIn width={100} height={100}>
					<Rect width={100} height={100} fillColor="blue" />
				</BounceIn>
			</Layer>
		</Canvas>
	)
}
```

### Using the useShape Hook

```tsx
import { useMemo } from 'react'
import { useShape } from '@maxxam0n/canvasify-react'
import { RectShape } from '@maxxam0n/canvasify-core'

function MyComponent() {
	const shape = useMemo(
		() =>
			new RectShape({
				x: 10,
				y: 10,
				width: 100,
				height: 50,
				fillColor: 'blue',
			}),
		[],
	)
	useShape(shape)
	return null
}
```

### Custom Shape via useShape

You can implement your own shape by creating a class (or object) that implements `BaseShape` from `@maxxam0n/canvasify-core`: it must provide `draw(ctx)`, `shapeParams` (`zIndex`, `opacity`) and `meta`. Then use `useShape` in a component and place it inside a layer like any other shape.

```tsx
import { useMemo } from 'react'
import type { BaseShape, ShapeParams } from '@maxxam0n/canvasify-core'
import { Canvas, Layer, useShape, Rect } from '@maxxam0n/canvasify-react'

interface StarShapeParams {
	cx: number
	cy: number
	radius: number
	fillColor?: string
	opacity?: number
	zIndex?: number
}

class StarShape implements BaseShape {
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

function StarShapeComponent({
	cx = 0,
	cy = 0,
	radius = 30,
	fillColor = 'gold',
	opacity = 1,
	zIndex = 0,
}: StarShapeParams) {
	const shape = useMemo(
		() => new StarShape({ cx, cy, radius, fillColor, opacity, zIndex }),
		[cx, cy, radius, fillColor, opacity, zIndex],
	)
	useShape(shape)
	return null
}

function App() {
	return (
		<Canvas width={400} height={300}>
			<Layer name="main">
				<Rect x={50} y={50} width={80} height={80} fillColor="lightblue" />
				<StarShapeComponent cx={200} cy={150} radius={40} fillColor="gold" />
			</Layer>
		</Canvas>
	)
}
```

## Components

### Canvas

Root component that creates a canvas container. Pointer interaction uses core `createPointerInteraction`: hit-test, hover enter/leave, wheel, and per-shape CSS cursors.

**Props:**

- `width?: number` - Canvas width (default: 500)
- `height?: number` - Canvas height (default: 300)
- `background?: string` - Background color (default: 'transparent')
- `children?: React.ReactNode` - Child components (layers, shapes, etc.)
- `onShapePointerDown?: (event: ShapePointerEvent) => void` - pointerdown on a shape
- `onShapePointerMove?: (event: ShapePointerEvent) => void` - pointermove over a shape
- `onShapePointerUp?: (event: ShapePointerEvent) => void` - pointerup on a shape
- `onShapePointerEnter?: (event: ShapePointerEvent) => void` - cursor entered a shape
- `onShapePointerLeave?: (event: ShapePointerEvent) => void` - cursor left a shape
- `onShapePointerCancel?: (event: ShapePointerEvent) => void` - pointercancel on a shape
- `onShapeWheel?: (event: ShapeWheelEvent) => void` - wheel over a shape
- `onShapeClick?: (event: ShapePointerEvent) => void` - click (down+up on the same shape)

Event types `ShapePointerEvent` and `ShapeWheelEvent` are exported from `@maxxam0n/canvasify-core`. Each event includes logical canvas coordinates (`x`, `y`), `nativeEvent`, and `hit` (`layerName`, `shapeId`, `meta`, `zIndex`).

| Prop | When |
|------|------|
| `onShapePointerDown` | pointerdown on a shape |
| `onShapePointerMove` | pointermove over a shape |
| `onShapePointerUp` | pointerup over a shape |
| `onShapePointerEnter` | cursor entered a shape |
| `onShapePointerLeave` | cursor left a shape |
| `onShapePointerCancel` | pointercancel on a shape |
| `onShapeWheel` | wheel over a shape |
| `onShapeClick` | click (down+up on the same shape) |

```tsx
import type { ShapePointerEvent } from '@maxxam0n/canvasify-core'
import { Canvas, Layer, Rect } from '@maxxam0n/canvasify-react'

function App() {
	const handleClick = (event: ShapePointerEvent) => {
		console.log(event.hit.shapeId, event.x, event.y)
	}

	return (
		<Canvas width={400} height={300} onShapeClick={handleClick}>
			<Layer name="main">
				<Rect x={10} y={10} width={80} height={40} fillColor="blue" cursor="pointer" />
			</Layer>
		</Canvas>
	)
}
```

### Layer

Represents a canvas layer. Must be a child of `Canvas`.

**Props:**

- `name: string` - Unique layer identifier
- `opacity?: number` - Layer opacity (default `1`)
- `zIndex?: number` - Stacking order (default `0`)
- `renderer?: RenderLayer` - Optional custom layer renderer (incompatible with `workerRenderer`)
- `spatialIndex?: boolean | { cellSize?: number; threshold?: number }` - Hit-test spatial index (core defaults: enabled, `threshold: 64`, `cellSize: 32`). Passed at construction; changing this prop remounts the layer.
- `workerRenderer?: LayerWorkerRendererOptions` - **Experimental:** paint via `OffscreenCanvas` + Web Worker. Passed at construction; changing this prop remounts the layer. Prefer a stable `createWorker` / `port` reference (e.g. `useMemo` / module-level factory).
- `children?: React.ReactNode` - Shapes and groups to render

#### Experimental Worker paint

Opt-in layer paint via `OffscreenCanvas` + Web Worker. Hit-test stays on the main thread. Shape components / `useShape` pass `{ source }` automatically.

```tsx
import { useMemo } from 'react'
import { Canvas, Layer, Rect } from '@maxxam0n/canvasify-react'
import type { LayerWorkerRendererOptions } from '@maxxam0n/canvasify-core'

const workerRenderer: LayerWorkerRendererOptions = {
	createWorker: () =>
		new Worker(new URL('@maxxam0n/canvasify-core/render-worker', import.meta.url)),
}

function App() {
	const options = useMemo(() => workerRenderer, [])

	return (
		<Canvas width={800} height={600}>
			<Layer name="main" workerRenderer={options}>
				<Rect x={10} y={10} width={100} height={50} fillColor="blue" />
			</Layer>
		</Canvas>
	)
}
```

**Limitations (v1):** requires `OffscreenCanvas` / `transferControlToOffscreen`; incompatible with custom `renderer`; Image / Text / PatternPaint unsupported in worker snapshots; `cache()` / `setStatic(true)` / `toDataURL()` / `toBlob()` throw in worker mode. See `@maxxam0n/canvasify-core` README for full details.

### Group

Container for grouping shapes together.

**Props:**

- `children?: React.ReactNode` - Child shapes and groups

### Transform

Applies transformations to its children.

**Props:**

- `translate?: { translateX: number; translateY: number }` - Translation
- `scale?: { scaleX: number; scaleY: number; originX?: number; originY?: number }` - Scale
- `rotate?: { angle: number; originX?: number; originY?: number }` - Rotation (angle in radians)
- `skew?: { skewX: number; skewY: number; originX?: number; originY?: number }` - Shear (radians)
- `matrix?: { a: number; b: number; c: number; d: number; e: number; f: number }` - Affine matrix
- `clipRect?: { x: number; y: number; width: number; height: number }` - Clip in local space
- `children?: React.ReactNode` - Child shapes and groups

For convenience, `Group` accepts `x`, `y` and passes them to `Transform` as `translate`.

### Shape Components

- `Circle` (alias CircleShape) - Circular shapes
- `Ellipse` - Elliptical shapes
- `Rect` - Rectangles
- `Polygon` - Polygons
- `Line` - Lines
- `Text` - Text (`wrap`, `lineHeight`, `\n`; see core `TextParams` / `layoutTextLines`)
- `Image` - Images
- `Path` - Path commands

Each shape component accepts props matching the corresponding shape parameters from `@maxxam0n/canvasify-core` (`fillColor`, `strokeColor`, `lineCap` / `lineJoin` / `lineDash`, `cx`/`cy` for Circle/Ellipse, `x`/`y` for Rect, pattern/gradient paints, etc.), plus optional interaction and draw-effect props:

| Prop | Default | Effect |
|------|---------|--------|
| `listening` | `true` | `false` skips hit-test for this shape |
| `cursor` | — | CSS cursor on hover (`Canvas` applies via pointer interaction) |
| `hitStrokeWidth` | — | Extra stroke hit padding on **Rect, Circle, Ellipse** |
| `shadowColor` / `shadowBlur` / `shadowOffsetX` / `shadowOffsetY` | — | Canvas shadow |
| `globalCompositeOperation` | — | Canvas composite mode |

`Image` also supports `onError?: (error: Error) => void` from core `ImageParams`.

> **Performance note:** `Layer` enables a spatial hit-test index automatically at 64+ shapes (`spatialIndex` prop; defaults from core). Bitmap `cache()` / `setStatic()` are available on the core layer via `Canvas` ref `getCore().getLayer(name)`.

## Hooks

### useShape

Hook for programmatically creating shapes within a Layer context. Accepts a `BaseShape` instance (or `null`) and optional interaction options as a second argument.

```tsx
import { useMemo } from 'react'
import { useShape } from '@maxxam0n/canvasify-react'
import { RectShape } from '@maxxam0n/canvasify-core'

const shape = useMemo(
	() =>
		new RectShape({
			x: 10,
			y: 10,
			width: 100,
			height: 50,
			fillColor: 'blue',
			hitStrokeWidth: 8,
		}),
	[],
)
useShape(shape, {
	cursor: 'grab',
	hitStrokeWidth: 8,
	shadowColor: 'rgba(0,0,0,0.3)',
	shadowBlur: 4,
})
```

The component calling `useShape` must be a descendant of `Layer`.

### Context Hooks

Hooks for injecting canvas context. Use them inside `Canvas` / `Layer` / `Group` / `Transform` to access the current context.

| Hook | Returns | Description |
|------|---------|-------------|
| `useCurrentLayer` | `Layer \| null \| undefined` | Layer instance where shapes are drawn |
| `useCurrentCanvas` | `Canvas \| null` | Root Canvas instance |
| `useCanvasSize` | `{ width, height } \| null` | Canvas dimensions |
| `useCurrentGroup` | `GroupParams \| null` | Current group params (opacity, zIndex) |
| `useCurrentTransforms` | `Transform[]` | Stack of transforms applied to children |

```tsx
import { useCurrentLayer, useCurrentCanvas } from '@maxxam0n/canvasify-react'

function DebugInfo() {
	const layer = useCurrentLayer()
	const canvas = useCurrentCanvas()

	if (!layer || !canvas) return null

	return (
		<div>
			Layer: {layer.name}, shapes: {layer.shapes.size}
		</div>
	)
}

// Inside Layer
<Layer name="main">
	<Rect width={100} height={50} fillColor="blue" />
	<DebugInfo />
</Layer>
```

## License

MIT
