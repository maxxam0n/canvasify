import type { ShapeStrokeParams, StrokeStyle } from '../model/stroke.types'

/** Применяет параметры обводки к контексту перед ctx.stroke() / strokeRect() / strokeText(). */
export const applyStrokeStyle = (ctx: CanvasRenderingContext2D, style: ShapeStrokeParams): void => {
	if (style.lineWidth !== undefined) {
		ctx.lineWidth = style.lineWidth
	}
	if (style.lineCap !== undefined) {
		ctx.lineCap = style.lineCap
	}
	if (style.lineJoin !== undefined) {
		ctx.lineJoin = style.lineJoin
	}
	if (style.lineDash !== undefined) {
		ctx.setLineDash(style.lineDash)
	}
	if (style.lineDashOffset !== undefined) {
		ctx.lineDashOffset = style.lineDashOffset
	}
}

/** Возвращает только заданные поля стиля обводки для meta. */
export const pickStrokeStyleMeta = (style: StrokeStyle): Partial<StrokeStyle> => {
	const meta: Partial<StrokeStyle> = {}
	if (style.lineCap !== undefined) meta.lineCap = style.lineCap
	if (style.lineJoin !== undefined) meta.lineJoin = style.lineJoin
	if (style.lineDash !== undefined) meta.lineDash = style.lineDash
	if (style.lineDashOffset !== undefined) meta.lineDashOffset = style.lineDashOffset
	return meta
}
