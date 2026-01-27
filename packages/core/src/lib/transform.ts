import type { Transform } from '../model/transform.types'

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
		}
	})
}
