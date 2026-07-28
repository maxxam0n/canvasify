import { applyTransformsToCtx } from './transform'
import type { DrawEffects } from '../model/draw-effects.types'
import type { BaseShape, ShapeDrawingContext, ShapeParams } from '../model/shape.types'
import type { Transform } from '../model/transform.types'

let shapeIdCounter = 0

export const createShapeId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	shapeIdCounter += 1
	return `shape-${shapeIdCounter}-${Math.random().toString(36).slice(2, 11)}`
}

export type BaseShapeToDrawingContextOptions = {
	id?: string
	transforms?: Transform[]
	shapeParams?: Partial<ShapeParams>
	listening?: boolean
	hitStrokeWidth?: number
	cursor?: string
} & DrawEffects

export const baseShapeToDrawingContext = (
	shape: BaseShape,
	options?: BaseShapeToDrawingContextOptions,
): ShapeDrawingContext => {
	const id = options?.id ?? createShapeId()
	const transforms = options?.transforms ?? []
	const baseParams = shape.shapeParams
	const overrideParams = options?.shapeParams ?? {}
	const shapeParams: ShapeParams = {
		opacity: overrideParams.opacity ?? baseParams.opacity,
		zIndex: overrideParams.zIndex ?? baseParams.zIndex,
	}

	return {
		id,
		shapeParams,
		meta: shape.meta,
		transforms,
		draw: (ctx: CanvasRenderingContext2D) => shape.draw(ctx),
		transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, transforms),
		contains: shape.contains
			? (x, y, hitStrokeWidth) => shape.contains!(x, y, hitStrokeWidth)
			: undefined,
		getLocalBounds: shape.getLocalBounds ? () => shape.getLocalBounds!() : undefined,
		listening: options?.listening,
		hitStrokeWidth: options?.hitStrokeWidth,
		cursor: options?.cursor,
		shadowColor: options?.shadowColor,
		shadowBlur: options?.shadowBlur,
		shadowOffsetX: options?.shadowOffsetX,
		shadowOffsetY: options?.shadowOffsetY,
		globalCompositeOperation: options?.globalCompositeOperation,
	}
}

/** Сортировка фигур по zIndex (asc = снизу вверх, desc = сверху вниз для hit-test). */
export const sortShapesByZIndex = (
	shapes: ShapeDrawingContext[],
	order: 'asc' | 'desc' = 'asc',
): ShapeDrawingContext[] => {
	const sorted = [...shapes].sort(
		(a, b) => (a.shapeParams.zIndex || 0) - (b.shapeParams.zIndex || 0),
	)
	return order === 'desc' ? sorted.reverse() : sorted
}
