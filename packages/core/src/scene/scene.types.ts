import type { CircleParams } from '../core/shapes/Circle'
import type { EllipseParams } from '../core/shapes/Ellipse'
import type { ImageParams } from '../core/shapes/Image'
import type { LineParams } from '../core/shapes/Line'
import type { PolygonParams } from '../core/shapes/Polygon'
import type { RectParams } from '../core/shapes/Rect'
import type { TextParams } from '../core/shapes/Text'
import type { BaseShape } from '../model/shape.types'
import type {
	RotationParams,
	ScaleParams,
	Transform,
	TranslateParams,
} from '../model/transform.types'
import type { GroupParams } from '../model/types'

export type SceneOptions = {
	width: number
	height: number
	background?: string
	layers?: string[]
}

export type GroupOptions = {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
	opacity?: number
	zIndex?: number
}

export type AddShapeOptions = {
	id?: string
	transforms?: Transform[]
	shapeParams?: Partial<GroupParams>
}

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
	group(options: GroupOptions, fn: (layer: LayerHandle) => void): string[]
}
