import type { Rect } from '../model/rect.types'
import type { Transform } from '../model/transform.types'
import type { Point } from '../model/types'

export const inflateRect = (rect: Rect, padding: number): Rect => ({
	x: rect.x - padding,
	y: rect.y - padding,
	width: rect.width + padding * 2,
	height: rect.height + padding * 2,
})

export const unionRects = (a: Rect, b: Rect): Rect => {
	const left = Math.min(a.x, b.x)
	const top = Math.min(a.y, b.y)
	const right = Math.max(a.x + a.width, b.x + b.width)
	const bottom = Math.max(a.y + a.height, b.y + b.height)
	return { x: left, y: top, width: right - left, height: bottom - top }
}

export const unionRectList = (rects: Rect[]): Rect | undefined => {
	if (rects.length === 0) return undefined
	return rects.reduce((acc, rect) => unionRects(acc, rect))
}

export const rectsIntersect = (a: Rect, b: Rect): boolean => {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export const normalizeRect = (rect: Rect): Rect => {
	const x = rect.width < 0 ? rect.x + rect.width : rect.x
	const y = rect.height < 0 ? rect.y + rect.height : rect.y
	return {
		x,
		y,
		width: Math.abs(rect.width),
		height: Math.abs(rect.height),
	}
}

export const aabbFromPoints = (points: Point[]): Rect => {
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity

	for (const point of points) {
		minX = Math.min(minX, point.x)
		minY = Math.min(minY, point.y)
		maxX = Math.max(maxX, point.x)
		maxY = Math.max(maxY, point.y)
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	}
}

const rectCorners = (rect: Rect): Point[] => {
	const { x, y, width, height } = normalizeRect(rect)
	return [
		{ x, y },
		{ x: x + width, y },
		{ x: x + width, y: y + height },
		{ x, y: y + height },
	]
}

const applyGeometricForward = (point: Point, transform: Transform): Point => {
	let { x, y } = point

	switch (transform.type) {
		case 'translate': {
			x += transform.translateX
			y += transform.translateY
			break
		}
		case 'scale': {
			const originX = transform.originX ?? 0
			const originY = transform.originY ?? 0
			x = originX + (x - originX) * transform.scaleX
			y = originY + (y - originY) * transform.scaleY
			break
		}
		case 'rotation': {
			const originX = transform.originX ?? 0
			const originY = transform.originY ?? 0
			const cos = Math.cos(transform.angle)
			const sin = Math.sin(transform.angle)
			const dx = x - originX
			const dy = y - originY
			x = dx * cos - dy * sin + originX
			y = dx * sin + dy * cos + originY
			break
		}
		default:
			break
	}

	return { x, y }
}

/**
 * Переводит локальный AABB фигуры в мировые координаты слоя.
 * clip-rect пропускается (допускается over-invalidate).
 * Порядок: как у canvas CTM — transforms применяются к точке с конца массива.
 */
export const transformRectToWorld = (rect: Rect, transforms: Transform[]): Rect => {
	if (transforms.length === 0) return normalizeRect(rect)

	const mapped = rectCorners(rect).map(corner => {
		let point = corner
		for (let i = transforms.length - 1; i >= 0; i--) {
			const transform = transforms[i]
			if (transform.type === 'clip-rect') continue
			point = applyGeometricForward(point, transform)
		}
		return point
	})

	return aabbFromPoints(mapped)
}
