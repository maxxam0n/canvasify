import type { Point } from '../model/types'

export type StrokeHitMode = {
	hasFill: boolean
	hasStroke: boolean
	halfStroke: number
	hitPad: number
}

export const getStrokeHitMode = (
	fillColor: unknown,
	strokeColor: unknown,
	lineWidth: number,
	hitStrokeWidth?: number,
): StrokeHitMode => {
	const hasFill = Boolean(fillColor)
	const hasStroke = Boolean(strokeColor) && lineWidth > 0
	const halfStroke = hasStroke ? lineWidth / 2 : 0
	const hitPad = hitStrokeWidth ?? 0
	return { hasFill, hasStroke, halfStroke, hitPad }
}

/** Hit-test круга с учётом fill/stroke и hitStrokeWidth. */
export const hitTestCircle = (
	x: number,
	y: number,
	cx: number,
	cy: number,
	radius: number,
	mode: StrokeHitMode,
): boolean => {
	const { hasFill, hasStroke, halfStroke, hitPad } = mode
	if (!hasFill && !hasStroke) return false

	const dx = x - cx
	const dy = y - cy
	const distSq = dx * dx + dy * dy
	const outer = radius + halfStroke + hitPad
	const outerSq = outer * outer

	if (hasFill) {
		const fillOuter = hasStroke ? outer : radius
		return distSq <= fillOuter * fillOuter
	}

	const inner = Math.max(0, radius - halfStroke - hitPad)
	return distSq <= outerSq && distSq >= inner * inner
}

/** Hit-test эллипса с учётом fill/stroke и hitStrokeWidth. */
export const hitTestEllipse = (
	x: number,
	y: number,
	cx: number,
	cy: number,
	radiusX: number,
	radiusY: number,
	rotation: number,
	mode: StrokeHitMode,
): boolean => {
	const { hasFill, hasStroke, halfStroke, hitPad } = mode
	if (!hasFill && !hasStroke) return false

	const pad = halfStroke + hitPad
	const outerRx = radiusX + (hasStroke ? pad : 0)
	const outerRy = radiusY + (hasStroke ? pad : 0)

	if (hasFill) {
		return pointInEllipse(x, y, cx, cy, outerRx, outerRy, rotation)
	}

	if (!pointInEllipse(x, y, cx, cy, outerRx, outerRy, rotation)) return false

	const innerRx = Math.max(0, radiusX - pad)
	const innerRy = Math.max(0, radiusY - pad)
	if (innerRx <= 0 || innerRy <= 0) return true

	return !pointInEllipse(x, y, cx, cy, innerRx, innerRy, rotation)
}

/** Hit-test прямоугольника с учётом fill/stroke и hitStrokeWidth. */
export const hitTestRect = (
	x: number,
	y: number,
	rect: { x: number; y: number; width: number; height: number },
	mode: StrokeHitMode,
): boolean => {
	const { hasFill, hasStroke, halfStroke, hitPad } = mode
	if (!hasFill && !hasStroke) return false

	const pad = halfStroke + hitPad

	if (hasFill) {
		if (hasStroke) {
			return pointInRect(x, y, {
				x: rect.x - pad,
				y: rect.y - pad,
				width: rect.width + pad * 2,
				height: rect.height + pad * 2,
			})
		}
		return pointInRect(x, y, rect)
	}

	const outer = {
		x: rect.x - pad,
		y: rect.y - pad,
		width: rect.width + pad * 2,
		height: rect.height + pad * 2,
	}
	if (!pointInRect(x, y, outer)) return false

	const inner = {
		x: rect.x + pad,
		y: rect.y + pad,
		width: Math.max(0, rect.width - pad * 2),
		height: Math.max(0, rect.height - pad * 2),
	}
	if (inner.width > 0 && inner.height > 0 && pointInRect(x, y, inner)) return false

	return true
}

/** Внешний радиус круга для bounds/hit (с учётом обводки и hitPad). */
export const circleHitOuterRadius = (
	radius: number,
	mode: StrokeHitMode,
): number => {
	const { hasFill, hasStroke, halfStroke, hitPad } = mode
	if (!hasFill && !hasStroke) return radius
	if (hasStroke) return radius + halfStroke + hitPad
	return radius
}

export const pointInRect = (
	x: number,
	y: number,
	rect: { x: number; y: number; width: number; height: number },
): boolean => {
	const minX = Math.min(rect.x, rect.x + rect.width)
	const maxX = Math.max(rect.x, rect.x + rect.width)
	const minY = Math.min(rect.y, rect.y + rect.height)
	const maxY = Math.max(rect.y, rect.y + rect.height)
	return x >= minX && x <= maxX && y >= minY && y <= maxY
}

export const pointInCircle = (
	x: number,
	y: number,
	cx: number,
	cy: number,
	radius: number,
): boolean => {
	const dx = x - cx
	const dy = y - cy
	return dx * dx + dy * dy <= radius * radius
}

/** Точка внутри эллипса с поворотом `rotation` (радианы) вокруг центра. */
export const pointInEllipse = (
	x: number,
	y: number,
	cx: number,
	cy: number,
	radiusX: number,
	radiusY: number,
	rotation = 0,
): boolean => {
	if (radiusX <= 0 || radiusY <= 0) return false

	const cos = Math.cos(-rotation)
	const sin = Math.sin(-rotation)
	const dx = x - cx
	const dy = y - cy
	const localX = dx * cos - dy * sin
	const localY = dx * sin + dy * cos

	const nx = localX / radiusX
	const ny = localY / radiusY
	return nx * nx + ny * ny <= 1
}

/** Ray-casting для замкнутого многоугольника. */
export const pointInPolygon = (x: number, y: number, points: Point[]): boolean => {
	if (points.length < 3) return false

	let inside = false
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const xi = points[i].x
		const yi = points[i].y
		const xj = points[j].x
		const yj = points[j].y

		const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
		if (intersects) inside = !inside
	}
	return inside
}

export const distanceToSegment = (
	x: number,
	y: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number => {
	const dx = x2 - x1
	const dy = y2 - y1
	if (dx === 0 && dy === 0) {
		const ex = x - x1
		const ey = y - y1
		return Math.hypot(ex, ey)
	}

	const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
	const projX = x1 + t * dx
	const projY = y1 + t * dy
	return Math.hypot(x - projX, y - projY)
}
