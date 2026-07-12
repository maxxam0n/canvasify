import type { LayerWorkerRendererOptions } from '../core/Layer'
import type { CircleParams } from '../core/shapes/Circle'
import type { EllipseParams } from '../core/shapes/Ellipse'
import type { ImageParams } from '../core/shapes/Image'
import type { LineParams } from '../core/shapes/Line'
import type { PolygonParams } from '../core/shapes/Polygon'
import type { RectParams } from '../core/shapes/Rect'
import type { PathParams } from '../core/shapes/Path'
import type { TextParams } from '../core/shapes/Text'
import type { DrawEffects } from '../model/draw-effects.types'
import type { BaseShape } from '../model/shape.types'
import type {
	RotationParams,
	ScaleParams,
	Transform,
	TranslateParams,
} from '../model/transform.types'
import type { GroupParams } from '../model/types'
import type {
	ShapePointerEvent,
	ShapeWheelEvent,
} from '../interaction/pointer-interaction.types'

export type SceneInteractionHandlers = {
	/** pointerdown по фигуре (логические координаты canvas). */
	onShapePointerDown?: (event: ShapePointerEvent) => void
	/** pointermove по фигуре. */
	onShapePointerMove?: (event: ShapePointerEvent) => void
	/** pointerup по фигуре. */
	onShapePointerUp?: (event: ShapePointerEvent) => void
	/** Курсор вошёл на фигуру. */
	onShapePointerEnter?: (event: ShapePointerEvent) => void
	/** Курсор покинул фигуру. */
	onShapePointerLeave?: (event: ShapePointerEvent) => void
	/** pointercancel по фигуре. */
	onShapePointerCancel?: (event: ShapePointerEvent) => void
	/** wheel над фигурой. */
	onShapeWheel?: (event: ShapeWheelEvent) => void
	/** click (down+up на одной фигуре). */
	onShapeClick?: (event: ShapePointerEvent) => void
}

export type SceneOptions = {
	width: number
	height: number
	background?: string
	layers?: string[]
	/** Experimental: opt layers into worker paint. See README — Experimental Worker. */
	workerRenderer?: LayerWorkerRendererOptions
	/**
	 * If set with `workerRenderer`, only these layer names use the worker.
	 * If omitted, all layers use the worker.
	 */
	workerLayers?: string[]
} & SceneInteractionHandlers

export type GroupOptions = {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
	/** Прямоугольный clip в локальных координатах группы. */
	clipRect?: { x: number; y: number; width: number; height: number }
	opacity?: number
	zIndex?: number
}

export type AddShapeOptions = {
	id?: string
	transforms?: Transform[]
	shapeParams?: Partial<GroupParams>
	listening?: boolean
	cursor?: string
	hitStrokeWidth?: number
} & DrawEffects

export type RemoveOptions = {
	/** Выбросить ошибку, если фигура с указанным id не найдена */
	strict?: boolean
}

export type LayerHandle = {
	add(shape: BaseShape, options?: AddShapeOptions): string
	remove(id: string, options?: RemoveOptions): void
	rect(params: RectParams): string
	circle(params: CircleParams): string
	ellipse(params: EllipseParams): string
	line(params: LineParams): string
	polygon(params: PolygonParams): string
	text(params: TextParams): string
	image(params: ImageParams): string
	path(params: PathParams): string
	group(options: GroupOptions, fn: (layer: LayerHandle) => void): string[]
	hitTest(x: number, y: number): import('../model/hit-test.types').HitTestResult | undefined
}
