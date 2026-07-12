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
- **Export**: Export canvas/layers to DataURL or Blob
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Choosing an API

Canvasify core exposes two complementary entry points. Pick one path per app — do not mix them for the same DOM container.

| API | When to use | Owns DOM? | Rendering |
|-----|-------------|-----------|-----------|
| **Scene + LayerHandle** | Vanilla JS/TS, scripts, non-React/Vue apps | Yes — creates canvases inside a container | Automatic via `requestRender` |
| **Canvas + Layer** | React/Vue packages, or full manual control | No — you provide `<canvas>` elements | Call `requestRender` / wire `onDirty` |

- Prefer **Scene** for imperative scenes without a UI framework.
- Prefer **Canvas + Layer** when integrating with React/Vue (the framework packages already wrap this path).
- Custom shapes (`BaseShape`) work with both: `layer.add(shape)` on Scene handles, or `useShape` in frameworks.

### Hit-testing

```typescript
const hit = scene.hitTest(120, 80)
// { shapeId, layerName, meta, zIndex } | undefined

const layerHit = scene.getLayer('default')!.hitTest(120, 80)
```

In React/Vue use `onShapePointerDown` / `@shape-pointer-down` on `Canvas`, or `ref.hitTest(x, y)`.

Text hit-test uses `measureText` (with `actualBoundingBox*` when available) for a tighter AABB than font-size estimates.

### Dirty regions

When shapes expose `getLocalBounds()`, `Layer` marks only the affected AABB (plus 1px padding) and on the next frame clears/redraws inside a clip instead of wiping the whole canvas. `makeDirty()` without a region, `setSize`, custom `renderer`, or shapes without bounds still force a full redraw.

```typescript
layer.makeDirty({ x: 10, y: 10, width: 100, height: 40 })
layer.invalidateShape(shapeId) // async Image/Text after load
```

### Path, gradients, clip

```typescript
layer.path({
  commands: [
    { type: 'moveTo', x: 0, y: 0 },
    { type: 'lineTo', x: 40, y: 0 },
    { type: 'lineTo', x: 20, y: 30 },
    { type: 'closePath' },
  ],
  fillColor: {
    type: 'linear-gradient',
    x0: 0, y0: 0, x1: 40, y1: 0,
    stops: [
      { offset: 0, color: '#f00' },
      { offset: 1, color: '#00f' },
    ],
  },
})

layer.group(
  { clipRect: { x: 0, y: 0, width: 100, height: 50 } },
  g => {
    g.rect({ x: 0, y: 0, width: 200, height: 200, fillColor: 'green' })
  },
)
```

## Usage

### Low-Level API (Canvas + Layer)

The low-level API requires manual canvas element creation and wrapping shapes in `ShapeDrawingContext`:

```typescript
import {
	Canvas,
	Layer,
	RectShape,
	baseShapeToDrawingContext,
	createShapeId,
} from '@maxxam0n/canvasify-core'

const canvasEl = document.getElementById('canvas') as HTMLCanvasElement
const canvas = new Canvas()
const layer = new Layer({ name: 'myLayer', canvas: canvasEl })

const rect = new RectShape({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })
const ctx = baseShapeToDrawingContext(rect, { id: createShapeId() })
layer.setShape(ctx)
canvas.setLayer(layer)
canvas.render()
```

For most use cases, prefer the **Scene API** (see below).

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
	baseShapeToDrawingContext,
	createShapeId,
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

Represents a single canvas layer. Constructor: `new Layer({ name, canvas, opacity?, renderer?, onDirty? })`.

- `setShape(ctx: ShapeDrawingContext)`: Add or update a shape (use `baseShapeToDrawingContext` for wrapping)
- `removeShape(ctx: ShapeDrawingContext)`: Remove a shape from the layer
- `setOpacity(opacity: number)`: Update layer opacity (CSS on canvas + export compositing)
- `setRenderer(renderer?)`: Replace custom renderer
- `render()`: Render dirty shapes (full or dirty regions)
- `makeDirty(region?)`: Mark layer dirty — optional AABB for partial redraw
- `invalidateShape(id)`: Dirty the region for one shape (async Image/Text)

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
