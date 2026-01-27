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
  fill: 'blue'
}

const circle: CircleParams = {
  x: 150,
  y: 75,
  radius: 30,
  fill: 'red'
}

const text: TextParams = {
  x: 200,
  y: 100,
  text: 'Hello Canvasify',
  fontSize: 16,
  fill: 'black'
}

const rectShape = new RectShape(rect)
const circleShape = new CircleShape(circle)
const textShape = new TextShape(text)

layer.addShape(rectShape)
layer.addShape(circleShape)
layer.addShape(textShape)
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
  stepParticlesInPlace
} from '@maxxam0n/canvasify-core'
```

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

## License

MIT
