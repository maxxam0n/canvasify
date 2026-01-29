import type { RenderShapes } from '../model/shape.types'

export const renderShapes: RenderShapes = (ctx, shapes) => {
	const sortedShapes = [...shapes].sort(
		(a, b) => (a.shapeParams.zIndex || 0) - (b.shapeParams.zIndex || 0),
	)
	sortedShapes.forEach(({ draw, transform, shapeParams }) => {
		ctx.save()
		ctx.globalAlpha = shapeParams.opacity
		transform(ctx)
		draw(ctx)
		ctx.restore()
	})
}
