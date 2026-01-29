export { Canvas } from './core/Canvas'
export { Layer } from './core/Layer'
export { CircleShape } from './core/shapes/Circle'
export { EllipseShape } from './core/shapes/Ellipse'
export { ImageShape } from './core/shapes/Image'
export { LineShape } from './core/shapes/Line'
export { PolygonShape } from './core/shapes/Polygon'
export { RectShape } from './core/shapes/Rect'
export { TextShape } from './core/shapes/Text'

export type { LayerParams } from './core/Layer'
export type { CircleParams } from './core/shapes/Circle'
export type { EllipseParams } from './core/shapes/Ellipse'
export type { ImageParams, ImageStatus } from './core/shapes/Image'
export type { LineParams } from './core/shapes/Line'
export type { PolygonParams } from './core/shapes/Polygon'
export type { RectParams } from './core/shapes/Rect'
export type { TextParams } from './core/shapes/Text'

export { renderShapes } from './lib/render'
export { applyTransformsToCtx } from './lib/transform'
export { baseShapeToDrawingContext, createShapeId } from './lib/shape-context.utils'

export * from './model/export.types'
export * from './model/layer.types'
export * from './model/shape.types'
export * from './model/transform.types'
export * from './model/types'

export type { BaseShape, RenderShapes, ShapeDrawingContext, ShapeParams } from './model/shape.types'
export type { LayerData, RenderLayer } from './model/layer.types'
export type {
	RotationParams,
	ScaleParams,
	Transform,
	TranslateParams,
} from './model/transform.types'
export type { ContextHandler, GroupParams, Point } from './model/types'

export { Scene } from './scene/Scene'
export type {
	AddShapeOptions,
	GroupOptions,
	LayerHandle,
	RemoveOptions,
	SceneOptions,
} from './scene/scene.types'
