import { sortShapesByZIndex } from './shape-context.utils'
import type { RenderShapes } from '../model/shape.types'

export const renderShapes: RenderShapes = (ctx, shapes) => {
	const sortedShapes = sortShapesByZIndex(shapes, 'asc')
	sortedShapes.forEach(({ draw, transform, shapeParams }) => {
		ctx.save()
		ctx.globalAlpha = shapeParams.opacity
		transform(ctx)
		draw(ctx)
		ctx.restore()
	})
}
