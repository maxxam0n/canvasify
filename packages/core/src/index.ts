export { Canvas } from './core/Canvas'
export { Layer } from './core/Layer'
export { CircleShape } from './core/shapes/Circle'
export { EllipseShape } from './core/shapes/Ellipse'
export { ImageShape } from './core/shapes/Image'
export { LineShape } from './core/shapes/Line'
export { PathShape } from './core/shapes/Path'
export { PolygonShape } from './core/shapes/Polygon'
export { RectShape } from './core/shapes/Rect'
export { TextShape } from './core/shapes/Text'

export type {
	LayerParams,
	LayerRenderTarget,
	LayerSurfaceOptions,
	LayerWorkerRendererOptions,
	SetShapeOptions,
} from './core/Layer'
export type { CircleParams } from './core/shapes/Circle'
export type { EllipseParams } from './core/shapes/Ellipse'
export type { ImageParams, ImageStatus } from './core/shapes/Image'
export type { LineParams } from './core/shapes/Line'
export type { PathCommand, PathParams } from './core/shapes/Path'
export type { PolygonParams } from './core/shapes/Polygon'
export type { RectParams } from './core/shapes/Rect'
export type { TextParams } from './core/shapes/Text'

export { renderShapes } from './lib/render'
export { getRenderViewport } from './lib/render-context'
export {
	applyDrawEffectsToContext,
	hasShadowEffects,
	inflateWorldBoundsForEffects,
	requiresFullDirtyForComposite,
} from './lib/draw-effects.utils'
export { resolvePaint } from './lib/paint'
export { applyStrokeStyle } from './lib/stroke-style'
export {
	pointInCircle,
	pointInEllipse,
	pointInPolygon,
	pointInRect,
	distanceToSegment,
} from './lib/hit-test.utils'
export {
	aabbFromPoints,
	inflateRect,
	normalizeRect,
	rectsIntersect,
	transformRectToWorld,
	unionRectList,
	unionRects,
} from './lib/rect.utils'
export { measureTextBounds, layoutTextLines, resetTextMeasureContext } from './lib/text-metrics.utils'
export {
	DEFAULT_SPATIAL_CELL_SIZE,
	DEFAULT_SPATIAL_THRESHOLD,
	UniformGridSpatialIndex,
	resolveSpatialIndexConfig,
} from './lib/spatial-index'
export type {
	ResolvedSpatialIndexConfig,
	SpatialIndexBoundsResolver,
	SpatialIndexConfig,
	SpatialIndexOptions,
} from './lib/spatial-index'
export { applyTransformsToCtx, invertPointThroughTransforms } from './lib/transform'
export {
	baseShapeToDrawingContext,
	createShapeId,
	sortShapesByZIndex,
} from './lib/shape-context.utils'

export * from './model/draw-effects.types'
export * from './model/export.types'
export * from './model/hit-test.types'
export * from './model/layer.types'
export * from './model/paint.types'
export * from './model/rect.types'
export * from './model/shape.types'
export * from './model/stroke.types'
export * from './model/transform.types'
export * from './model/types'

export type { BaseShape, RenderShapes, ShapeDrawingContext, ShapeParams } from './model/shape.types'
export type { LayerData, RenderLayer } from './model/layer.types'
export type { Rect } from './model/rect.types'
export type {
	ClipRectParams,
	MatrixParams,
	RotationParams,
	ScaleParams,
	SkewParams,
	Transform,
	TranslateParams,
} from './model/transform.types'
export type { ContextHandler, GroupParams, Point } from './model/types'
export type { CanvasHitTestResult, HitTestResult } from './model/hit-test.types'
export type {
	ColorStop,
	LinearGradientPaint,
	Paint,
	PatternPaint,
	RadialGradientPaint,
} from './model/paint.types'
export type { ShapeStrokeParams, StrokeStyle } from './model/stroke.types'

export { Scene } from './scene/Scene'
export { createPointerInteraction } from './interaction/pointer-interaction'
export { createDragHelper } from './helpers/drag'
export type {
	AddShapeOptions,
	GroupOptions,
	LayerHandle,
	RemoveOptions,
	SceneInteractionHandlers,
	SceneOptions,
} from './scene/scene.types'
export type {
	PointerInteraction,
	PointerInteractionHandlers,
	PointerInteractionOptions,
	PointerLogicalCoords,
	ShapePointerEvent,
	ShapeWheelEvent,
} from './interaction/pointer-interaction.types'
export type {
	DragEndEvent,
	DragHelper,
	DragHelperFilter,
	DragHelperHandlers,
	DragHelperOptions,
	DragLogicalPoint,
	DragMoveEvent,
	DragStartEvent,
} from './helpers/drag.types'

/** Experimental Web Worker paint protocol (opt-in via Layer `workerRenderer`). */
export {
	WORKER_PROTOCOL_VERSION,
	applyMainToWorkerMessage,
	createInitialWorkerState,
	createMockWorkerPort,
	createRealWorkerPort,
	shapeToWorkerSnapshot,
	shapesMapToWorkerSnapshots,
	toWorkerSnapshot,
} from './worker'
export type {
	ApplyMainToWorkerResult,
	CreateMockWorkerPortOptions,
	MainToWorkerMessage,
	MockWorkerPort,
	RealWorkerPortOptions,
	ShapeToWorkerSnapshotContext,
	WorkerCircleSnapshot,
	WorkerDisposeMessage,
	WorkerEllipseSnapshot,
	WorkerErrorCode,
	WorkerErrorMessage,
	WorkerFrameDoneMessage,
	WorkerInitMessage,
	WorkerLineSnapshot,
	WorkerPathSnapshot,
	WorkerPolygonSnapshot,
	WorkerProtocolVersion,
	WorkerReadyMessage,
	WorkerRectSnapshot,
	WorkerRenderMessage,
	WorkerRenderPort,
	WorkerRenderState,
	WorkerResizeMessage,
	WorkerSerializablePaint,
	WorkerSetShapesMessage,
	WorkerShapeKind,
	WorkerShapeSnapshot,
	WorkerShapeSnapshotBase,
	WorkerToMainMessage,
} from './worker'
