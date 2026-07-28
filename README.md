# Canvasify

A lightweight browser-first library for working with HTML5 Canvas, providing a declarative API for creating and managing canvas graphics with support for layers, shapes, transformations, and effects.

Canvasify requires the browser DOM and Canvas 2D APIs. The core package is framework-agnostic, but rendering is not intended for Node.js, React Native, or headless environments without a compatible DOM/canvas adapter.

The published packages support Node.js 22.12+ for installation, SSR imports, and build tooling.

## 📦 Packages

Canvasify consists of three main packages:

- **[@maxxam0n/canvasify-core](./packages/core/)** - Base rendering engine, framework-agnostic
- **[@maxxam0n/canvasify-react](./packages/react/)** - React components for declarative rendering
- **[@maxxam0n/canvasify-vue](./packages/vue/)** - Vue 3 components for declarative rendering

## 🚀 Quick Start

There are two ways to use the core engine:

- **Scene API** (below) — imperative, owns the container DOM; best for vanilla JS/TS.
- **Canvas + Layer** — low-level / used by React and Vue packages; you supply canvas elements.

### Core (Vanilla JS/TypeScript)

```bash
npm install @maxxam0n/canvasify-core
```

```typescript
import { Scene } from '@maxxam0n/canvasify-core'

const container = document.getElementById('app')!
const scene = new Scene(container, { width: 500, height: 300 })

const layer = scene.getLayer('default')!
layer.rect({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })
layer.circle({ cx: 150, cy: 75, radius: 30, fillColor: 'red' })
// Rendering happens automatically

scene.destroy() // on unmount
```

### React

```bash
npm install @maxxam0n/canvasify-react
```

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

### Vue 3.5+

```bash
npm install @maxxam0n/canvasify-vue
```

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

## ✨ Key Features

- **Multi-layer Rendering** - Manage multiple independent layers; Scene `setLayerOpacity` / `setLayerZIndex`
- **Rich Shape Set** - Circle, Ellipse, Rect, Polygon, Line, Text, Image, Path
- **Hit-testing** - `hitTest`, stroke-aware Circle/Ellipse/Rect, `listening` / `hitStrokeWidth`; works with nested transforms
- **Pointer events** - Eight handlers on Scene and React/Vue `Canvas` (`ShapePointerEvent`)
- **Drag helper** - `createDragHelper` in core for pointer-capture drags with `dx`/`dy`
- **Paint** - CSS color, linear/radial gradients, pattern fills (`{ type: 'pattern', image, repetition? }`)
- **Draw effects** - Shadow (`shadowColor` / `Blur` / `OffsetX` / `OffsetY`) and `globalCompositeOperation` on shapes
- **Transforms** - Translate, scale, rotate, skew, matrix, `clipRect` (React/Vue `Transform`; Scene via `transforms` / group)
- **Text layout** - `\n`, optional `wrap` + `maxWidth`, `lineHeight`; `layoutTextLines` helper
- **Grouping** - Combine shapes into groups for joint operations
- **Layer cache / static** - `cache()`, `clearCache()`, `setStatic()` for mostly static layers; bitmap cache prefers `OffscreenCanvas` when available
- **Export** - Export canvas to DataURL or Blob with quality settings
- **Animation** - Drive motion by updating props in `requestAnimationFrame` (see package docs)
- **TypeScript** - Full type support
- **Performance** - Dirty regions (non-`source-over` composite forces full dirty), spatial hit-test index (auto at 64 shapes; React/Vue `Layer` expose `spatialIndex`), layer bitmap cache (`OffscreenCanvas` preferred), requestAnimationFrame, z-index cache

## 🛠 Development

The project uses a monorepo with npm workspaces.

### Installing Dependencies

```bash
npm install
```

### Building All Packages

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

## 📚 Documentation

Detailed documentation for each package:

- [Core Documentation](./packages/core/README.md)
- [React Documentation](./packages/react/README.md)
- [Vue Documentation](./packages/vue/README.md)

## 📄 License

MIT
