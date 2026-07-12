import type { Point } from '../model/types'
import { distanceToSegment } from './hit-test.utils'

/** Число сегментов для аппроксимации кривой в полилинию. */
export const DEFAULT_CURVE_SAMPLES = 12

const TAU = Math.PI * 2

/** Точка на кубической кривой Безье при параметре t ∈ [0, 1]. */
export const cubicBezierPoint = (
	x0: number,
	y0: number,
	cp1x: number,
	cp1y: number,
	cp2x: number,
	cp2y: number,
	x1: number,
	y1: number,
	t: number,
): Point => {
	const mt = 1 - t
	const mt2 = mt * mt
	const t2 = t * t
	const a = mt2 * mt
	const b = 3 * mt2 * t
	const c = 3 * mt * t2
	const d = t2 * t
	return {
		x: a * x0 + b * cp1x + c * cp2x + d * x1,
		y: a * y0 + b * cp1y + c * cp2y + d * y1,
	}
}

/** Точка на квадратичной кривой Безье при t ∈ [0, 1]. */
export const quadraticBezierPoint = (
	x0: number,
	y0: number,
	cpx: number,
	cpy: number,
	x1: number,
	y1: number,
	t: number,
): Point => {
	const mt = 1 - t
	return {
		x: mt * mt * x0 + 2 * mt * t * cpx + t * t * x1,
		y: mt * mt * y0 + 2 * mt * t * cpy + t * t * y1,
	}
}

/** Семплирование кубической кривой (конечная точка включена, начальная — нет). */
export const sampleCubicBezier = (
	x0: number,
	y0: number,
	cp1x: number,
	cp1y: number,
	cp2x: number,
	cp2y: number,
	x1: number,
	y1: number,
	steps: number = DEFAULT_CURVE_SAMPLES,
): Point[] => {
	const points: Point[] = []
	for (let i = 1; i <= steps; i++) {
		const t = i / steps
		points.push(cubicBezierPoint(x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1, t))
	}
	return points
}

/** Семплирование квадратичной кривой (конечная точка включена, начальная — нет). */
export const sampleQuadraticBezier = (
	x0: number,
	y0: number,
	cpx: number,
	cpy: number,
	x1: number,
	y1: number,
	steps: number = DEFAULT_CURVE_SAMPLES,
): Point[] => {
	const points: Point[] = []
	for (let i = 1; i <= steps; i++) {
		const t = i / steps
		points.push(quadraticBezierPoint(x0, y0, cpx, cpy, x1, y1, t))
	}
	return points
}

/** Нормализует угол конца дуги по правилам Canvas arc(). */
export const normalizeArcSweep = (
	startAngle: number,
	endAngle: number,
	counterclockwise = false,
): { start: number; end: number } => {
	const start = startAngle
	let end = endAngle

	if (!counterclockwise) {
		while (end < start) end += TAU
	} else {
		while (end > start) end -= TAU
	}

	return { start, end }
}

/** Начальная точка дуги в координатах Canvas. */
export const arcStartPoint = (
	cx: number,
	cy: number,
	radius: number,
	startAngle: number,
): Point => ({
	x: cx + radius * Math.cos(startAngle),
	y: cy + radius * Math.sin(startAngle),
})

/** Конечная точка дуги после нормализации углов. */
export const arcEndPoint = (
	cx: number,
	cy: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	counterclockwise = false,
): Point => {
	const { end } = normalizeArcSweep(startAngle, endAngle, counterclockwise)
	return {
		x: cx + radius * Math.cos(end),
		y: cy + radius * Math.sin(end),
	}
}

/**
 * Семплирование дуги по правилам Canvas arc().
 * Начальная точка дуги не дублируется — её нужно добавить отдельно при построении контура.
 */
export const sampleArc = (
	cx: number,
	cy: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	counterclockwise = false,
	steps: number = DEFAULT_CURVE_SAMPLES,
): Point[] => {
	const { start, end } = normalizeArcSweep(startAngle, endAngle, counterclockwise)
	const sweep = Math.abs(end - start)
	if (sweep === 0) return []

	const points: Point[] = []
	for (let i = 1; i <= steps; i++) {
		const t = i / steps
		const angle = counterclockwise ? start - sweep * t : start + sweep * t
		points.push({
			x: cx + radius * Math.cos(angle),
			y: cy + radius * Math.sin(angle),
		})
	}
	return points
}

/** Минимальное расстояние от точки до полилинии. */
export const distanceToPolyline = (x: number, y: number, points: Point[]): number => {
	if (points.length === 0) return Infinity
	if (points.length === 1) return Math.hypot(x - points[0].x, y - points[0].y)

	let minDist = Infinity
	for (let i = 1; i < points.length; i++) {
		const dist = distanceToSegment(
			x,
			y,
			points[i - 1].x,
			points[i - 1].y,
			points[i].x,
			points[i].y,
		)
		if (dist < minDist) minDist = dist
	}
	return minDist
}
