/** Поверхность bitmap-кеша: OffscreenCanvas или HTMLCanvasElement. */
export type CacheCanvas = HTMLCanvasElement | OffscreenCanvas

/** 2D-контекст поверхности кеша. */
export type CacheCanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export type CacheSurface = {
	canvas: CacheCanvas
	ctx: CacheCanvasContext
}

/**
 * Создаёт буфер bitmap-кеша заданного размера (физические пиксели).
 * Предпочитает OffscreenCanvas — нет DOM-узла для кеша; иначе HTMLCanvasElement.
 */
export const createCacheSurface = (width: number, height: number): CacheSurface => {
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(width, height)
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('failed to create cache surface: OffscreenCanvas context not found')
		}
		return { canvas, ctx }
	}

	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) {
		throw new Error('failed to create cache surface: canvas context not found')
	}
	return { canvas, ctx }
}
