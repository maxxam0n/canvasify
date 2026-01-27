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
import { Canvas, Layer, RectShape, CircleShape } from '@maxxam0n/canvasify-react'

function App() {
  return (
    <Canvas width={800} height={600} bgColor="#f0f0f0">
      <Layer name="main">
        <RectShape
          x={10}
          y={10}
          width={100}
          height={50}
          fill="blue"
        />
        <CircleShape
          x={150}
          y={75}
          radius={30}
          fill="red"
        />
      </Layer>
    </Canvas>
  )
}
```

### Using Groups and Transforms

```tsx
import { Canvas, Layer, Group, TransformGroup, RectShape } from '@maxxam0n/canvasify-react'

function App() {
  return (
    <Canvas width={800} height={600}>
      <Layer name="main">
        <Group>
          <TransformGroup x={100} y={100} rotation={45}>
            <RectShape width={50} height={50} fill="green" />
          </TransformGroup>
        </Group>
      </Layer>
    </Canvas>
  )
}
```

### Using the useShape Hook

```tsx
import { useShape } from '@maxxam0n/canvasify-react'
import type { RectParams } from '@maxxam0n/canvasify-react'

function MyComponent() {
  const shape = useShape<RectParams>({
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    fill: 'blue'
  })

  // shape is automatically added to the current layer context
  return null
}
```

## Components

### Canvas

Root component that creates a canvas container.

**Props:**
- `width?: number` - Canvas width (default: 500)
- `height?: number` - Canvas height (default: 300)
- `bgColor?: string` - Background color (default: 'white')
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

### TransformGroup

Applies transformations to its children.

**Props:**
- `x?: number` - X translation
- `y?: number` - Y translation
- `rotation?: number` - Rotation in degrees
- `scaleX?: number` - X scale factor
- `scaleY?: number` - Y scale factor
- `children?: React.ReactNode` - Child shapes and groups

### Shape Components

- `CircleShape` - Circular shapes
- `EllipseShape` - Elliptical shapes
- `RectShape` - Rectangles
- `PolygonShape` - Polygons
- `LineShape` - Lines
- `TextShape` - Text
- `ImageShape` - Images

Each shape component accepts props matching the corresponding shape parameters from `@maxxam0n/canvasify-core`.

## Hooks

### useShape

Hook for programmatically creating and managing shapes within a layer context.

```tsx
const shape = useShape<ShapeParams>(params)
```

## License

MIT
