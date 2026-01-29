export { default as Canvas } from './ui/Canvas.vue'
export { default as Group } from './ui/Group.vue'
export { default as Layer } from './ui/Layer.vue'
export { default as Transform } from './ui/Transform.vue'

export { default as Circle } from './ui/shapes/Circle.vue'
export { default as Ellipse } from './ui/shapes/Ellipse.vue'
export { default as Image } from './ui/shapes/Image.vue'
export { default as Line } from './ui/shapes/Line.vue'
export { default as Polygon } from './ui/shapes/Polygon.vue'
export { default as Rect } from './ui/shapes/Rect.vue'
export { default as Text } from './ui/shapes/Text.vue'

export { useShape } from './lib/use-shape'

export type {
	CanvasExportOptions,
	CanvasComponentExpose,
	LayerExportOptions,
} from '@maxxam0n/canvasify-core'

export type CanvasRefExpose = import('@maxxam0n/canvasify-core').CanvasComponentExpose & {
	getCore: () => import('@maxxam0n/canvasify-core').Canvas
	getLayer: (name: string) => import('@maxxam0n/canvasify-core').Layer | undefined
}
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
