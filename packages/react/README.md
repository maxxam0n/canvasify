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
					<Transform rotate={{ angle: (45 * Math.PI) / 180 }}>
						<Rect width={50} height={50} fillColor="green" />
					</Transform>
				</Group>
			</Layer>
		</Canvas>
	)
}
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

Root component that creates a canvas container.

**Props:**

- `width?: number` - Canvas width (default: 500)
- `height?: number` - Canvas height (default: 300)
- `background?: string` - Background color (default: 'transparent')
- `children?: React.ReactNode` - Child components (layers, shapes, etc.)

### Layer

Represents a canvas layer. Must be a child of `Canvas`.

**Props:**

- `name: string` - Unique layer identifier
- `children?: React.ReactNode` - Shapes and groups to render

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
- `children?: React.ReactNode` - Child shapes and groups

For convenience, `Group` accepts `x`, `y` and passes them to `Transform` as `translate`.

### Shape Components

- `Circle` (alias CircleShape) - Circular shapes
- `Ellipse` - Elliptical shapes
- `Rect` - Rectangles
- `Polygon` - Polygons
- `Line` - Lines
- `Text` - Text
- `Image` - Images

Each shape component accepts props matching the corresponding shape parameters from `@maxxam0n/canvasify-core` (`fillColor`, `strokeColor`, `cx`/`cy` for Circle/Ellipse, `x`/`y` for Rect, etc.).

## Hooks

### useShape

Hook for programmatically creating shapes within a Layer context. Accepts a `BaseShape` instance (or `null`).

```tsx
import { useMemo } from 'react'
import { useShape } from '@maxxam0n/canvasify-react'
import { RectShape } from '@maxxam0n/canvasify-core'

const shape = useMemo(
	() => new RectShape({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' }),
	[],
)
useShape(shape)
```

The component calling `useShape` must be a descendant of `Layer`.

## License

MIT
