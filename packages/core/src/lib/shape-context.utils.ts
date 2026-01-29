import { applyTransformsToCtx } from './transform'
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
}

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
		draw: (ctx: CanvasRenderingContext2D) => shape.draw(ctx),
		transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, transforms),
	}
}
