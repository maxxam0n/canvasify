# Canvasify

A lightweight and functional library for working with HTML5 Canvas, providing a declarative API for creating and managing canvas graphics with support for layers, shapes, transformations, and effects.

## 📦 Packages

Canvasify consists of three main packages:

- **[@maxxam0n/canvasify-core](./packages/core/)** - Base rendering engine, framework-agnostic
- **[@maxxam0n/canvasify-react](./packages/react/)** - React components for declarative rendering
- **[@maxxam0n/canvasify-vue](./packages/vue/)** - Vue 3 components for declarative rendering

## 🚀 Quick Start

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

### Vue 3

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

- **Multi-layer Rendering** - Manage multiple independent layers
- **Rich Shape Set** - Circle, Ellipse, Rect, Polygon, Line, Text, Image
- **Transformations** - Rotation, scaling, translation
- **Grouping** - Combine shapes into groups for joint operations
- **Export** - Export canvas to DataURL or Blob with quality settings
- **Effects** - Animation effects (via custom components)
- **TypeScript** - Full type support
- **Performance** - Optimized rendering using requestAnimationFrame

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
