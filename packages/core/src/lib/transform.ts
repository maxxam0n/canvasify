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
		default:
			break
	}

	return { x, y }
}

/**
 * Переводит точку из мировых координат в локальные shape-координаты,
 * проходя transforms в обратном порядке. Возвращает null, если точка вне clip.
 */
export const invertPointThroughTransforms = (
	point: Point,
	transforms: Transform[],
): Point | null => {
	let x = point.x
	let y = point.y

	for (let i = transforms.length - 1; i >= 0; i--) {
		const transform = transforms[i]

		if (transform.type === 'clip-rect') {
			const hasGeometricAfter = transforms
				.slice(i + 1)
				.some(entry => entry.type !== 'clip-rect')

			let checkX = x
			let checkY = y

			// Если после clip нет геометрии, текущая точка ещё в world —
			// нужно инвертировать предшествующие geo, чтобы попасть в пространство clip.
			if (!hasGeometricAfter) {
				for (let j = i - 1; j >= 0; j--) {
					const prev = transforms[j]
					if (prev.type === 'clip-rect') continue
					;({ x: checkX, y: checkY } = invertGeometric({ x: checkX, y: checkY }, prev))
				}
			}

			if (!pointInRect(checkX, checkY, transform)) return null
			continue
		}

		;({ x, y } = invertGeometric({ x, y }, transform))
	}

	return { x, y }
}
