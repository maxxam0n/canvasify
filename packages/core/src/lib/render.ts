import { applyDrawEffectsToContext } from './draw-effects.utils'
import { sortShapesByZIndex } from './shape-context.utils'
import type { RenderShapes } from '../model/shape.types'

export const renderShapes: RenderShapes = (ctx, shapes) => {
	const sortedShapes = sortShapesByZIndex(shapes, 'asc')
	sortedShapes.forEach(shape => {
		const { draw, transform, shapeParams } = shape
		ctx.save()
		ctx.globalAlpha = shapeParams.opacity
		applyDrawEffectsToContext(ctx, shape)
		transform(ctx)
		draw(ctx)
		ctx.restore()
	})
}
