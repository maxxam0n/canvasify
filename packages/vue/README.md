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
      <Rect
        :x="10"
        :y="10"
        :width="100"
        :height="50"
        fill="blue"
      />
      <Circle
        :x="150"
        :y="75"
        :radius="30"
        fill="red"
      />
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
  ExplosionEffect
} from '@maxxam0n/canvasify-vue'
</script>
```

### Using the useShape Composable

```vue
<template>
  <Canvas :width="800" :height="600">
    <Layer name="main">
      <!-- Shapes are automatically rendered -->
    </Layer>
  </Canvas>
</template>

<script setup lang="ts">
import { Canvas, Layer, useShape } from '@maxxam0n/canvasify-vue'
import type { RectParams } from '@maxxam0n/canvasify-core'

const shape = useShape<RectParams>({
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  fill: 'blue'
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
