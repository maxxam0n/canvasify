export { Canvas } from './components/canvas'
export type {
	CanvasRefExpose,
	CanvasProps,
	ShapePointerHandler,
	ShapeWheelHandler,
} from './components/canvas'
export { Layer } from './components/layer'
export type { LayerProps } from './components/layer'
export { Group } from './components/group'
export { TransformGroup as Transform } from './components/transform'

export { CircleShape as Circle } from './components/shapes/circle-shape'
export { EllipseShape as Ellipse } from './components/shapes/ellipse-shape'
export { ImageShape as Image } from './components/shapes/image-shape'
export { LineShape as Line } from './components/shapes/line-shape'
export { PathShape as Path } from './components/shapes/path-shape'
export { PolygonShape as Polygon } from './components/shapes/polygon-shape'
export { RectShape as Rect } from './components/shapes/rect-shape'
export { TextShape as Text } from './components/shapes/text-shape'

export { useShape, splitShapeInteractionProps } from './hooks/use-shape'
export type { UseShapeOptions, ShapeInteractionProps } from './hooks/use-shape'
export {
	useCurrentLayer,
	useCurrentCanvas,
	useCanvasSize,
	useCanvasViewport,
	useCurrentGroup,
	useCurrentTransforms,
} from './hooks/use-canvas-context'
