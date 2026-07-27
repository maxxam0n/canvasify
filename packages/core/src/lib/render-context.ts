import type { Rect } from '../model/rect.types'

const renderViewports = new WeakMap<CanvasRenderingContext2D, Rect>()

export const getRenderViewport = (
	ctx: CanvasRenderingContext2D,
): Rect | undefined => renderViewports.get(ctx)

export const withRenderViewport = <T>(
	ctx: CanvasRenderingContext2D,
	viewport: Rect,
	render: () => T,
): T => {
	const previous = renderViewports.get(ctx)
	renderViewports.set(ctx, viewport)

	try {
		return render()
	} finally {
		if (previous) {
			renderViewports.set(ctx, previous)
		} else {
			renderViewports.delete(ctx)
		}
	}
}
