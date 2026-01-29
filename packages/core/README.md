# @maxxam0n/canvasify-core

Core rendering engine for Canvasify - a powerful canvas manipulation library.

## Overview

`@maxxam0n/canvasify-core` provides the foundational classes and utilities for canvas rendering, layer management, shape creation, and transformations. It's a framework-agnostic library that can be used with any JavaScript/TypeScript project.

## Installation

```bash
npm install @maxxam0n/canvasify-core
```

## Features

- **Canvas Management**: Create and manage multiple canvas layers
- **Shape Rendering**: Support for various shapes (Circle, Ellipse, Rectangle, Polygon, Line, Text, Image)
- **Transformations**: Apply transforms to shapes and layers
- **Particle System**: Built-in particle effects utilities
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Usage

### Basic Canvas Setup

```typescript
import { Canvas, Layer } from '@maxxam0n/canvasify-core'

const canvas = new Canvas()
const layer = new Layer('myLayer', document.getElementById('canvas') as HTMLCanvasElement)

canvas.setLayer(layer)
canvas.render()
```

### Creating Shapes

```typescript
import { RectShape, CircleShape, TextShape } from '@maxxam0n/canvasify-core'
import type { RectParams, CircleParams, TextParams } from '@maxxam0n/canvasify-core'

const rect: RectParams = {
	x: 10,
	y: 10,
	width: 100,
	height: 50,
	fill: 'blue',
}

const circle: CircleParams = {
	x: 150,
	y: 75,
	radius: 30,
	fill: 'red',
}

const text: TextParams = {
	x: 200,
	y: 100,
	text: 'Hello Canvasify',
	fontSize: 16,
	fill: 'black',
}

const rectShape = new RectShape(rect)
const circleShape = new CircleShape(circle)
const textShape = new TextShape(text)

layer.setShape(rectShape)
layer.setShape(circleShape)
layer.setShape(textShape)
```

### Available Shapes

- `CircleShape` - Circular shapes
- `EllipseShape` - Elliptical shapes
- `RectShape` - Rectangles and squares
- `PolygonShape` - Multi-sided polygons
- `LineShape` - Straight lines
- `TextShape` - Text rendering
- `ImageShape` - Image rendering

### Utilities

```typescript
import {
	renderShapes,
	applyTransformsToCtx,
	createRadialParticles,
	drawParticles,
	stepParticlesInPlace,
} from '@maxxam0n/canvasify-core'
```

## Scene API — Building a Scene Without a Framework

The `Scene` class provides a high-level imperative API for building canvas scenes in plain JS/TS, without React or Vue. It owns the container and DOM: creates canvas elements, layers, and wires automatic rendering. **Rendering is automatic** — when you add, change, or remove shapes, the engine schedules a redraw; you do not need to call `requestRender` manually.

### Basic Example

```typescript
import { Scene } from '@maxxam0n/canvasify-core'

const container = document.getElementById('app')!
const scene = new Scene(container, { width: 500, height: 300 })

const layer = scene.getLayer('default')!
const id1 = layer.rect({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })
layer.circle({ cx: 150, cy: 75, radius: 30, fillColor: 'red' })
// Rendering happens automatically after setShape

// Later
layer.remove(id1)
// Rendering triggers automatically again

scene.destroy()
```

### Groups and Transforms

Groups apply transforms (translate, scale, rotate) and group-level opacity/zIndex to their children. API mirrors React/Vue `Group` + `TransformGroup`:

```typescript
layer.group(
	{
		translate: { translateX: 20, translateY: 10 },
		opacity: 0.8,
	},
	l => {
		l.rect({ x: 0, y: 0, width: 50, height: 50, fillColor: 'blue' })
		l.circle({ cx: 25, cy: 25, radius: 15, fillColor: 'red' })
	},
)
```

### Custom Shapes

You can add custom shapes by implementing `BaseShape` from `@maxxam0n/canvasify-core`: provide `draw(ctx)`, `shapeParams` (zIndex, opacity), and `meta`. Then pass the instance to `layer.add()` — analogous to Custom Shape via `useShape` in React/Vue.

```typescript
import type { BaseShape, ShapeParams } from '@maxxam0n/canvasify-core'
import { Scene } from '@maxxam0n/canvasify-core'

class StarShape implements BaseShape {
	constructor(
		private cx: number,
		private cy: number,
		private radius: number,
		private fillColor = 'gold',
	) {}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.fillColor
		ctx.beginPath()
		for (let i = 0; i < 10; i++) {
			const r = i % 2 === 0 ? this.radius : this.radius * 0.4
			const a = (i * Math.PI) / 5 - Math.PI / 2
			const x = this.cx + r * Math.cos(a)
			const y = this.cy + r * Math.sin(a)
			if (i === 0) ctx.moveTo(x, y)
			else ctx.lineTo(x, y)
		}
		ctx.closePath()
		ctx.fill()
	}

	get shapeParams(): ShapeParams {
		return { zIndex: 0, opacity: 1 }
	}

	get meta() {
		return { cx: this.cx, cy: this.cy, radius: this.radius }
	}
}

const scene = new Scene(container, { width: 400, height: 300 })
const layer = scene.getLayer('default')!
const id = layer.add(new StarShape(100, 100, 30))
// Later: layer.remove(id)
```

### Scene Methods

- `getLayer(name: string): LayerHandle | undefined` — returns a handle for the layer
- `setSize(width: number, height: number): void` — updates container and all layers
- `render(): void` — forces an immediate render (usually not needed)
- `toDataURL(options?): string` — exports canvas to data URL
- `toBlob(options?): Promise<Blob>` — exports canvas to Blob
- `destroy(): void` — cancels scheduled render, removes canvas elements from DOM, clears references

For declarative React or Vue usage, see `@maxxam0n/canvasify-react` and `@maxxam0n/canvasify-vue`.

## API

### Canvas

Main canvas container that manages layers.

- `setLayer(layer: Layer)`: Add or update a layer
- `getLayer(name: string)`: Retrieve a layer by name
- `deleteLayer(name: string)`: Remove a layer
- `getLayers()`: Get all layers
- `render()`: Render all layers
- `requestRender()`: Schedule a render on the next animation frame
- `cancelRender()`: Cancel scheduled render

### Layer

Represents a single canvas layer.

- `addShape(shape)`: Add a shape to the layer
- `removeShape(shape)`: Remove a shape from the layer
- `render()`: Render all shapes in the layer
- `clear()`: Clear the layer

### Scene

High-level imperative API for building scenes without a framework. Owns container and DOM, creates layers, wires automatic rendering.

- `getLayer(name)`: Get layer handle
- `setSize(width, height)`: Update dimensions
- `render()`: Force immediate render
- `toDataURL(options?)`: Export to data URL
- `toBlob(options?)`: Export to Blob
- `destroy()`: Cleanup and remove from DOM

### LayerHandle (Scene API)

Handle returned by `scene.getLayer()`. Methods: `add(shape, options?)`, `remove(id)`, `rect(params)`, `circle(params)`, `ellipse(params)`, `line(params)`, `polygon(params)`, `text(params)`, `image(params)`, `group(options, fn)`.

## License

MIT
