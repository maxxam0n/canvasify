# @maxxam0n/canvasify-core

Core rendering engine for Canvasify - a powerful canvas manipulation library.

## Overview

`@maxxam0n/canvasify-core` provides the foundational classes and utilities for canvas rendering, layer management, shape creation, and transformations. It is framework-agnostic and intended for browser-based JavaScript/TypeScript applications with DOM and Canvas 2D support.

## Installation

```bash
npm install @maxxam0n/canvasify-core
```

## Features

- **Canvas Management**: Create and manage multiple canvas layers
- **Shape Rendering**: Support for various shapes (Circle, Ellipse, Rectangle, Polygon, Line, Text, Image, Path)
- **Paint**: CSS color, linear/radial gradients, pattern fills
- **Draw effects**: Shadow and `globalCompositeOperation` on `ShapeDrawingContext` / `AddShapeOptions`
- **Transformations**: Translate, scale, rotate, skew, matrix, clip-rect (nested; hit-test inverts the stack)
- **Text layout**: Hard breaks (`\n`), optional word wrap, `lineHeight`; `layoutTextLines` export
- **Pointer events**: `createPointerInteraction`, Scene handlers, hit-test + hover cursors
- **Drag helper**: `createDragHelper` for pointer capture and `dx`/`dy` tracking
- **Shape interaction**: `listening`, `cursor`, `hitStrokeWidth` on shapes
- **Spatial index**: Optional broad-phase for hit-test (auto-enabled at 64 shapes)
- **Layer cache / static**: Snapshot layers that rarely change
- **Export**: Export canvas/layers to DataURL or Blob
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Choosing an API

Canvasify core exposes two complementary entry points. Pick one path per app — do not mix them for the same DOM container.

| API                     | When to use                                | Owns DOM?                                 | Rendering                             |
| ----------------------- | ------------------------------------------ | ----------------------------------------- | ------------------------------------- |
| **Scene + LayerHandle** | Vanilla JS/TS, scripts, non-React/Vue apps | Yes — creates canvases inside a container | Automatic via `requestRender`         |
| **Canvas + Layer**      | React/Vue packages, or full manual control | No — you provide `<canvas>` elements      | Call `requestRender` / wire `onDirty` |

- Prefer **Scene** for imperative scenes without a UI framework.
- Prefer **Canvas + Layer** when integrating with React/Vue (the framework packages already wrap this path).
- Custom shapes (`BaseShape`) work with both: `layer.add(shape)` on Scene handles, or `useShape` in frameworks.

### Hit-testing

```typescript
const hit = scene.hitTest(120, 80)
// { shapeId, layerName, meta, zIndex } | undefined

const layerHit = scene.getLayer('default')!.hitTest(120, 80)
```

`Canvas.hitTest` / `Scene.hitTest` walk layers top-down and return the topmost shape under the point. Shapes with `listening: false` are skipped. **Circle, Ellipse, and Rect** support fill, stroke-only, and `hitStrokeWidth` padding on strokes. Text hit-test uses `measureText` (with `actualBoundingBox*` when available) for a tighter AABB than font-size estimates.

In React/Vue use `Canvas` pointer handlers / emits, or `ref.hitTest(x, y)`.

### Pointer events

`Scene` wires `createPointerInteraction` on the container. Pass handlers in constructor options or update later with `setInteractionHandlers`. Each callback receives a `ShapePointerEvent` (`x`, `y`, `nativeEvent`, `hit`) or `ShapeWheelEvent` for wheel.

| Handler                | When                              |
| ---------------------- | --------------------------------- |
| `onShapePointerDown`   | pointerdown on a shape            |
| `onShapePointerMove`   | pointermove over a shape          |
| `onShapePointerUp`     | pointerup over a shape            |
| `onShapePointerEnter`  | cursor entered a shape            |
| `onShapePointerLeave`  | cursor left a shape               |
| `onShapePointerCancel` | pointercancel on a shape          |
| `onShapeWheel`         | wheel over a shape                |
| `onShapeClick`         | click (down+up on the same shape) |

```typescript
import type { ShapePointerEvent } from '@maxxam0n/canvasify-core'
import { Scene } from '@maxxam0n/canvasify-core'

const scene = new Scene(container, {
	width: 500,
	height: 300,
	onShapeClick: (event: ShapePointerEvent) => {
		console.log(event.hit.shapeId, event.x, event.y)
	},
})

scene.setInteractionHandlers({ onShapePointerDown: event => console.log(event.hit) })
```

For custom DOM targets (without `Scene`), use `createPointerInteraction({ target, hitTest, getShapeCursor, ...handlers })` — same handler names as above (`onPointerDown`, `onPointerMove`, …). React/Vue `Canvas` uses this internally.

### Shape interaction (`listening`, `cursor`, `hitStrokeWidth`)

| Option           | Where                                                                        | Effect                                                                   |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `listening`      | `AddShapeOptions`, `ShapeDrawingContext`, React/Vue shape props / `useShape` | `false` excludes the shape from hit-test (default: participates)         |
| `cursor`         | same                                                                         | CSS cursor on hover; applied by pointer interaction via `getShapeCursor` |
| `hitStrokeWidth` | `RectParams` / `CircleParams` / `EllipseParams`, or shape component props    | Extra padding around stroke hit area on those shapes                     |

```typescript
const layer = scene.getLayer('default')!

layer.rect({
	x: 10,
	y: 10,
	width: 80,
	height: 40,
	strokeColor: '#333',
	lineWidth: 2,
	fillColor: undefined,
	hitStrokeWidth: 8,
})

layer.add(new RectShape({ x: 100, y: 10, width: 80, height: 40, fillColor: 'blue' }), {
	listening: true,
	cursor: 'grab',
})
```

### Drag helper

`createDragHelper` starts a drag on pointerdown over a hit-tested shape, captures the pointer, and emits move/end events with `dx`/`dy` in logical canvas coordinates.

```typescript
import { Scene, createDragHelper } from '@maxxam0n/canvasify-core'

const scene = new Scene(container, { width: 500, height: 300 })
const layer = scene.getLayer('default')!
const id = layer.rect({ x: 50, y: 50, width: 100, height: 60, fillColor: 'cornflowerblue' })

const drag = createDragHelper({
	target: container,
	hitTest: (x, y) => scene.hitTest(x, y),
	filter: hit => hit.shapeId === id, // or a shapeId string, or omit for any shape
	onStart: event => console.log('start', event.hit.shapeId),
	onMove: event => {
		// event.dx / event.dy since pointerdown
	},
	onEnd: event => console.log('end', event.dx, event.dy),
	onCancel: event => console.log('cancelled'),
})

drag.attach()

// on teardown:
drag.destroy()
scene.destroy()
```

`setHandlers` updates callbacks without re-attaching. Pair with `Scene` pointer handlers when you need hover/click in addition to drag.

### Dirty regions

When shapes expose `getLocalBounds()`, `Layer` marks only the affected AABB (plus 1px padding; inflated for shadows) and on the next frame clears/redraws inside a clip instead of wiping the whole canvas. `makeDirty()` without a region, `setSize`, custom `renderer`, shapes without bounds, or a non-`source-over` `globalCompositeOperation` still force a full redraw.

```typescript
layer.makeDirty({ x: 10, y: 10, width: 100, height: 40 })
layer.invalidateShape(shapeId) // async Image/Text after load
```

### Spatial index (hit-test)

`Layer` accepts `spatialIndex?: boolean | { cellSize?, threshold? }`. Default is **enabled**, with `threshold: 64` and `cellSize: 32`: when the shape count is below the threshold, hit-test stays linear; at/above threshold a uniform grid broad-phase runs. Pass `false` to disable, or `{ cellSize, threshold }` to tune.

```typescript
const layer = new Layer({
	name: 'main',
	canvas: canvasEl,
	spatialIndex: { cellSize: 48, threshold: 32 },
})
```

### Bitmap cache and static mode

For mostly static layers (backgrounds, exported snapshots), snapshot the canvas and skip shape redraws until the cache is cleared:

```typescript
layer.setSize(800, 600)
layer.render()
layer.cache() // snapshot current pixels into offscreen canvas
layer.setStatic(true)

// Further makeDirty/render cycles only blit the cache — shapes are not redrawn
layer.makeDirty()
layer.render()

layer.setShape(updatedShape) // invalidates cache; normal dirty rendering resumes
layer.render()

layer.clearCache() // or layer.setStatic(false)
```

- `cache()` renders first if dirty, then snapshots pixels into a cache surface sized to `width × height` (physical pixels, including DPR). Prefers `OffscreenCanvas` when available (no DOM node for the cache); otherwise falls back to an `HTMLCanvasElement`.
- With a custom `renderer`, `cache()` is a no-op.
- `setShape`, `removeShape`, `invalidateShape`, `setSize`, and `setRenderer` invalidate the cache automatically.
- `makeDirty` while `static && cached` still notifies `onDirty`, but `render()` only blits the snapshot.

### Experimental Worker paint

Opt-in layer paint via `OffscreenCanvas` + Web Worker. Hit-test stays on the main thread. Default `Layer` path is unchanged.

```typescript
import { Layer, RectShape, baseShapeToDrawingContext } from '@maxxam0n/canvasify-core'
import CanvasifyRenderWorker from '@maxxam0n/canvasify-core/render-worker?worker'

const canvasEl = document.getElementById('canvas') as HTMLCanvasElement

const layer = new Layer({
	name: 'worker',
	canvas: canvasEl,
	workerRenderer: {
		createWorker: () => new CanvasifyRenderWorker(),
	},
})

layer.setSize(800, 600) // transferControlToOffscreen + init (do not call getContext before this)

const rect = new RectShape({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })
layer.setShape(baseShapeToDrawingContext(rect), { source: rect })
layer.render()
```

With Scene, pass the same `workerRenderer` in `SceneOptions`. Omit `workerLayers` to enable the worker for every layer, or list names to opt in selectively. `LayerHandle` methods pass `source` automatically:

```typescript
import { Scene } from '@maxxam0n/canvasify-core'

const scene = new Scene(container, {
	width: 800,
	height: 600,
	layers: ['bg', 'fg'],
	workerRenderer: {
		createWorker: () => new CanvasifyRenderWorker(),
	},
	// optional: only these layers use the worker (omit = all layers)
	workerLayers: ['fg'],
})

scene.getLayer('fg')!.rect({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })
```

**Limitations (v1):**

- Requires `OffscreenCanvas` and `HTMLCanvasElement.transferControlToOffscreen` (throws on enable if missing).
- Incompatible with a custom `renderer` on the same layer.
- `viewport` is not supported on worker-rendered layers; use the full layer surface.
- `setShape` requires `{ source: BaseShape }` so snapshots can use `instanceof` discrimination.
- Image / Text / PatternPaint are not supported in worker snapshots yet.
- `cache()`, `setStatic(true)`, `toDataURL()`, and `toBlob()` throw in worker mode (main no longer owns the 2d context after transfer).
- Dirty state is cleared immediately after posting `render` (does not wait for `frameDone`).
- The example uses Vite's `?worker` asset import. With another bundler, use its worker/asset loader and pass the resulting factory through `createWorker`.
- Prefer `createWorker` (one Worker per layer). Do not reuse a single MessagePort/`port` across multiple Scene layers — each layer needs its own channel.

### Path, gradients, pattern, clip

`fillColor` / `strokeColor` accept `Paint`: a CSS string, linear/radial gradient, or pattern.

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
		x0: 0,
		y0: 0,
		x1: 40,
		y1: 0,
		stops: [
			{ offset: 0, color: '#f00' },
			{ offset: 1, color: '#00f' },
		],
	},
})

// Pattern paint (CanvasImageSource + optional repetition)
layer.rect({
	x: 0,
	y: 0,
	width: 200,
	height: 200,
	fillColor: { type: 'pattern', image: tileImage, repetition: 'repeat' },
})

layer.group({ clipRect: { x: 0, y: 0, width: 100, height: 50 } }, g => {
	g.rect({ x: 0, y: 0, width: 200, height: 200, fillColor: 'green' })
})
```

### Draw effects

Shadows and compositing live on `ShapeDrawingContext` / Scene `AddShapeOptions` (and React/Vue shape props):

| Field                             | Effect                   |
| --------------------------------- | ------------------------ |
| `shadowColor`                     | CSS shadow color         |
| `shadowBlur`                      | Blur radius              |
| `shadowOffsetX` / `shadowOffsetY` | Shadow offset            |
| `globalCompositeOperation`        | Canvas 2D composite mode |

```typescript
layer.add(new RectShape({ x: 10, y: 10, width: 80, height: 40, fillColor: 'blue' }), {
	shadowColor: 'rgba(0,0,0,0.4)',
	shadowBlur: 8,
	shadowOffsetX: 2,
	shadowOffsetY: 4,
	globalCompositeOperation: 'multiply',
})
```

Non-`source-over` composites mark the layer fully dirty (region redraw would be incorrect).

### Text layout

`TextShape` / `layer.text` support hard line breaks (`\n`), optional word wrap, and line height. Export `layoutTextLines` if you need the same layout outside a shape.

| Option       | Default          | Notes                                                       |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `wrap`       | `false`          | When `true` and `maxWidth` is set, wraps by words           |
| `lineHeight` | `fontSize * 1.2` | Distance between baselines                                  |
| `maxWidth`   | —                | Without `wrap`, still passed to `fillText` as squeeze width |

```typescript
import { layoutTextLines } from '@maxxam0n/canvasify-core'

layer.text({
	x: 20,
	y: 40,
	text: 'Hello\nworld',
	font: '16px sans-serif',
	fillColor: '#111',
	wrap: true,
	maxWidth: 120,
	lineHeight: 22,
})

const layout = layoutTextLines({
	text: 'Hello\nworld',
	font: '16px sans-serif',
	wrap: true,
	maxWidth: 120,
	lineHeight: 22,
})
// layout.lines, layout.lineHeight, …
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
- `PathShape` - Paths composed from move, line, curve, arc, rectangle, and close commands

### Utilities

```typescript
import {
	renderShapes,
	applyTransformsToCtx,
	baseShapeToDrawingContext,
	createShapeId,
	createPointerInteraction,
	createDragHelper,
	layoutTextLines,
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

`group()` applies translate, scale, rotate, and optional `clipRect`, plus group opacity/zIndex (mirrors React/Vue `Group` + `Transform`). Skew and matrix are part of the core `Transform` union — pass them via `add(shape, { transforms })` (or stack them on React/Vue `<Transform>`):

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

layer.add(new RectShape({ x: 0, y: 0, width: 40, height: 40, fillColor: 'orange' }), {
	transforms: [
		{ type: 'skew', skewX: 0.3, skewY: 0 },
		{ type: 'matrix', a: 1, b: 0, c: 0, d: 1, e: 100, f: 50 },
	],
})
```

Hit-test inverts nested transforms so pointer hits match drawn geometry.

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
- `setLayerOpacity(name: string, opacity: number): void` — updates layer opacity (CSS on canvas + export compositing; layer opacity affects hit-test)
- `setLayerZIndex(name: string, zIndex: number): void` — updates layer stacking order (CSS z-index + hit-test / export order)
- `setInteractionHandlers(handlers): void` — update pointer event callbacks after construction
- `hitTest(x, y)` — topmost shape at logical coordinates
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

Represents a single canvas layer. Constructor: `new Layer({ name, canvas, width?, height?, opacity?, zIndex?, static?, spatialIndex?, renderer?, exportRenderer?, workerRenderer?, onDirty? })`.

- `setShape(ctx: ShapeDrawingContext, options?: { source?: BaseShape })`: Add or update a shape (use `baseShapeToDrawingContext` for wrapping). Context may include DrawEffects (`shadow*`, `globalCompositeOperation`). With `workerRenderer`, `options.source` is required.
- `removeShape(ctx: ShapeDrawingContext)`: Remove a shape from the layer
- `getSize()`, `getViewport()`, `getPixelRatio()`: Read the current logical surface configuration
- `setSize(width, height)`: Update the full logical layer dimensions
- `setViewport(viewport?)`: Render a world-coordinate viewport, or pass `null` to render the full layer
- `setPixelRatio(pixelRatio?)`: Override the backing bitmap ratio
- `setMaxPixelCount(maxPixelCount?)`: Cap the backing bitmap allocation. A non-empty surface always keeps at least one physical pixel per dimension.
- `setSurface({ width?, height?, viewport?, pixelRatio?, maxPixelCount? })`: Atomically update surface options
- `setOpacity(opacity: number)`: Update layer opacity (CSS on canvas + export compositing)
- `setZIndex(zIndex: number)`: Update stacking order
- `setRenderer(renderer?)`: Replace custom renderer
- `setExportRenderer(renderer?)`: Replace only the renderer used by export
- `cache()`: Snapshot layer pixels into an offscreen buffer (`OffscreenCanvas` when available, else `HTMLCanvasElement`; no-op with custom renderer)
- `clearCache()`: Drop bitmap cache; restore normal dirty rendering
- `setStatic(static: boolean)`: When `true` and cache is valid, `render()` blits cache instead of redrawing shapes
- `render()`: Render dirty shapes (full or dirty regions), or blit cache in static mode; with `workerRenderer`, posts paint to the worker
- `renderToContext(ctx, target)`: Composite this layer into another 2D context
- `makeDirty(region?)`: Mark layer dirty — optional AABB for partial redraw
- `invalidateShape(id)`: Dirty the region for one shape (async Image/Text)
- `hitTest(x, y)`: Topmost listening shape; uses spatial index when enabled and above threshold (always on main thread)
- `toDataURL(options?)`, `toBlob(options?)`: Export the layer
- `dispose()` / `destroy()`: Idempotently release subscriptions and layer-owned worker resources

### Scene

High-level imperative API for building scenes without a framework. Owns container and DOM, creates layers, wires automatic rendering.

- `getLayer(name)`: Get layer handle
- `setLayerOpacity(name, opacity)`: Update layer opacity without recreating the layer
- `setLayerZIndex(name, zIndex)`: Update layer z-index without recreating the layer
- `setInteractionHandlers(handlers)`: Update pointer event callbacks
- `hitTest(x, y)`: Topmost shape at logical coordinates
- `setSize(width, height)`: Update dimensions
- `render()`: Force immediate render
- `toDataURL(options?)`: Export to data URL
- `toBlob(options?)`: Export to Blob
- `destroy()`: Cleanup and remove from DOM

### LayerHandle (Scene API)

Handle returned by `scene.getLayer()`. Methods: `add(shape, options?)`, `remove(id)`, `rect(params)`, `circle(params)`, `ellipse(params)`, `line(params)`, `polygon(params)`, `text(params)`, `image(params)`, `path(params)`, `group(options, fn)`, `hitTest(x, y)`.

`add` accepts `AddShapeOptions`: `listening`, `cursor`, `hitStrokeWidth`, `id`, `transforms`, `shapeParams`, plus DrawEffects (`shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`, `globalCompositeOperation`).

## License

MIT
