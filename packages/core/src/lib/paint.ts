import type { Paint } from '../model/paint.types'

/** Преобразует Paint в значение, пригодное для fillStyle/strokeStyle. */
export const resolvePaint = (
	ctx: CanvasRenderingContext2D,
	paint: Paint,
): string | CanvasGradient => {
	if (typeof paint === 'string') return paint

	if (paint.type === 'linear-gradient') {
		const gradient = ctx.createLinearGradient(paint.x0, paint.y0, paint.x1, paint.y1)
		for (const stop of paint.stops) {
			gradient.addColorStop(stop.offset, stop.color)
		}
		return gradient
	}

	const gradient = ctx.createRadialGradient(
		paint.x0,
		paint.y0,
		paint.r0,
		paint.x1,
		paint.y1,
		paint.r1,
	)
	for (const stop of paint.stops) {
		gradient.addColorStop(stop.offset, stop.color)
	}
	return gradient
}
