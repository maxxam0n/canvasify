import { pointInRect } from './hit-test.utils'
import type { Transform } from '../model/transform.types'
import type { Point } from '../model/types'

export const applyTransformsToCtx = (ctx: CanvasRenderingContext2D, transforms: Transform[]) => {
	transforms.forEach(transform => {
		switch (transform.type) {
			case 'translate': {
				ctx.translate(transform.translateX, transform.translateY)
				break
			}
			case 'scale': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0

				if (originX !== 0 || originY !== 0) {
					ctx.translate(originX, originY)
					ctx.scale(transform.scaleX, transform.scaleY)
					ctx.translate(-originX, -originY)
				} else {
					ctx.scale(transform.scaleX, transform.scaleY)
				}
				break
			}
			case 'rotation': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0

				if (originX !== 0 || originY !== 0) {
					ctx.translate(originX, originY)
					ctx.rotate(transform.angle)
					ctx.translate(-originX, -originY)
				} else {
					ctx.rotate(transform.angle)
				}
				break
			}
			case 'skew': {
				const originX = transform.originX ?? 0
				const originY = transform.originY ?? 0
				const tanX = Math.tan(transform.skewX)
				const tanY = Math.tan(transform.skewY)

				if (originX !== 0 || originY !== 0) {
					ctx.translate(originX, originY)
					ctx.transform(1, tanY, tanX, 1, 0, 0)
					ctx.translate(-originX, -originY)
				} else {
					ctx.transform(1, tanY, tanX, 1, 0, 0)
				}
				break
			}
			case 'matrix': {
				ctx.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
				break
			}
			case 'clip-rect': {
				ctx.beginPath()
				ctx.rect(transform.x, transform.y, transform.width, transform.height)
				ctx.clip()
				break
			}
		}
	})
}

const invertGeometric = (point: Point, transform: Transform): Point => {
	let { x, y } = point

	switch (transform.type) {
		case 'translate': {
			x -= transform.translateX
			y -= transform.translateY
			break
		}
		case 'scale': {
			const originX = transform.originX ?? 0
			const originY = transform.originY ?? 0
			const sx = transform.scaleX === 0 ? Number.EPSILON : transform.scaleX
			const sy = transform.scaleY === 0 ? Number.EPSILON : transform.scaleY

			x = (x - originX) / sx + originX
			y = (y - originY) / sy + originY
			break
		}
		case 'rotation': {
			const originX = transform.originX ?? 0
			const originY = transform.originY ?? 0
			const cos = Math.cos(-transform.angle)
			const sin = Math.sin(-transform.angle)
			const dx = x - originX
			const dy = y - originY
			x = dx * cos - dy * sin + originX
			y = dx * sin + dy * cos + originY
			break
		}
		case 'skew': {
			const originX = transform.originX ?? 0
			const originY = transform.originY ?? 0
			const tanX = Math.tan(transform.skewX)
			const tanY = Math.tan(transform.skewY)
			const dx = x - originX
			const dy = y - originY
			// Обратная к [1, tanX; tanY, 1]: det = 1 - tanX*tanY
			const rawDet = 1 - tanX * tanY
			const det = rawDet === 0 ? Number.EPSILON : rawDet
			const invDx = (dx - tanX * dy) / det
			const invDy = (-tanY * dx + dy) / det
			x = invDx + originX
			y = invDy + originY
			break
		}
		case 'matrix': {
			const { a, b, c, d, e, f } = transform
			const wx = x
			const wy = y
			let det = a * d - b * c
			if (det === 0) det = Number.EPSILON
			const invA = d / det
			const invB = -b / det
			const invC = -c / det
			const invD = a / det
			const invE = (c * f - d * e) / det
			const invF = (b * e - a * f) / det
			x = invA * wx + invC * wy + invE
			y = invB * wx + invD * wy + invF
			break
		}
		default:
			break
	}

	return { x, y }
}

/**
 * Переводит точку из мировых координат в локальные shape-координаты.
 * Для canvas CTM = T0·T1·…·Tn (applyTransformsToCtx идёт 0→n-1) инверсия
 * применяет T0⁻¹, затем T1⁻¹, … — тоже в порядке массива.
 * clip-rect проверяется в user-space на момент clip (после undo предшествующих geo).
 * Возвращает null, если точка вне clip.
 */
export const invertPointThroughTransforms = (
	point: Point,
	transforms: Transform[],
): Point | null => {
	let x = point.x
	let y = point.y

	for (let i = 0; i < transforms.length; i++) {
		const transform = transforms[i]

		if (transform.type === 'clip-rect') {
			if (!pointInRect(x, y, transform)) return null
			continue
		}

		;({ x, y } = invertGeometric({ x, y }, transform))
	}

	return { x, y }
}
