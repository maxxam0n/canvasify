/**
 * Эффекты отрисовки canvas 2D, применяемые на уровне ShapeDrawingContext.
 */
export type DrawEffects = {
	shadowColor?: string
	shadowBlur?: number
	shadowOffsetX?: number
	shadowOffsetY?: number
	globalCompositeOperation?: GlobalCompositeOperation
}
