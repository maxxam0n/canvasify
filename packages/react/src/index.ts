export { Canvas } from './components/canvas'
export type { CanvasRefExpose } from './components/canvas'
export { Layer } from './components/layer'
export { Group } from './components/group'
export { TransformGroup as Transform } from './components/transform'

export { CircleShape as Circle } from './components/shapes/circle-shape'
export { EllipseShape as Ellipse } from './components/shapes/ellipse-shape'
export { ImageShape as Image } from './components/shapes/image-shape'
export { LineShape as Line } from './components/shapes/line-shape'
export { PolygonShape as Polygon } from './components/shapes/polygon-shape'
export { RectShape as Rect } from './components/shapes/rect-shape'
export { TextShape as Text } from './components/shapes/text-shape'

export { useShape } from './hooks/use-shape'

export type {
	CanvasExportOptions,
	CanvasComponentExpose,
	LayerExportOptions,
} from '@maxxam0n/canvasify-core'
export type { LayerParams, RenderLayer } from '@maxxam0n/canvasify-core'
export type {
	CircleParams,
	EllipseParams,
	ImageParams,
	ImageStatus,
	LineParams,
	PolygonParams,
	RectParams,
	TextParams,
} from '@maxxam0n/canvasify-core'
export type {
	BaseShape,
	RenderShapes,
	ShapeDrawingContext,
	ShapeParams,
} from '@maxxam0n/canvasify-core'
export type {
	RotationParams,
	ScaleParams,
	Transform as TransformParams,
	TranslateParams,
} from '@maxxam0n/canvasify-core'
export type { ContextHandler, GroupParams, Point } from '@maxxam0n/canvasify-core'
