import type { Rect } from '../model/rect.types'

const renderViewports = new WeakMap<CanvasRenderingContext2D, Rect>()
const renderRegions = new WeakMap<CanvasRenderingContext2D, Rect>()

export const getRenderViewport = (ctx: CanvasRenderingContext2D): Rect | undefined =>
	renderViewports.get(ctx)

export const getRenderRegion = (ctx: CanvasRenderingContext2D): Rect | undefined =>
	renderRegions.get(ctx)

export const withRenderViewport = <T>(
	ctx: CanvasRenderingContext2D,
	viewport: Rect,
	render: () => T,
	region: Rect = viewport,
): T => {
	const previousViewport = renderViewports.get(ctx)
	const previousRegion = renderRegions.get(ctx)
	renderViewports.set(ctx, viewport)
	renderRegions.set(ctx, region)

	try {
		return render()
	} finally {
		if (previousViewport) {
			renderViewports.set(ctx, previousViewport)
		} else {
			renderViewports.delete(ctx)
		}
		if (previousRegion) {
			renderRegions.set(ctx, previousRegion)
		} else {
			renderRegions.delete(ctx)
		}
	}
}
