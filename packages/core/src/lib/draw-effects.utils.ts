import type { DrawEffects } from '../model/draw-effects.types'
import type { Rect } from '../model/rect.types'
import type { ShapeDrawingContext } from '../model/shape.types'

/** Есть ли у фигуры видимая тень (нужна для inflate dirty bounds). */
export const hasShadowEffects = (effects: DrawEffects): boolean => {
	const color = effects.shadowColor
	if (color === undefined || color === '' || color === 'transparent') return false
	return true
}

/**
 * Нестандартный composite влияет на пиксели вне bounds фигуры;
 * region dirty для таких фигур небезопасен.
 */
export const requiresFullDirtyForComposite = (effects: DrawEffects): boolean => {
	const op = effects.globalCompositeOperation
	return op !== undefined && op !== 'source-over'
}

/**
 * Расширяет world-bounds с учётом shadowBlur и смещения тени.
 * Без тени возвращает rect без изменений.
 */
export const inflateWorldBoundsForEffects = (rect: Rect, effects: DrawEffects): Rect => {
	if (!hasShadowEffects(effects)) return rect

	const blur = effects.shadowBlur ?? 0
	const offsetX = effects.shadowOffsetX ?? 0
	const offsetY = effects.shadowOffsetY ?? 0

	return {
		x: rect.x + Math.min(0, offsetX) - blur,
		y: rect.y + Math.min(0, offsetY) - blur,
		width: rect.width + Math.abs(offsetX) + blur * 2,
		height: rect.height + Math.abs(offsetY) + blur * 2,
	}
}

/** Применяет draw-effects к контексту (после globalAlpha, до transform). */
export const applyDrawEffectsToContext = (
	ctx: CanvasRenderingContext2D,
	shape: Pick<
		ShapeDrawingContext,
		'shadowColor' | 'shadowBlur' | 'shadowOffsetX' | 'shadowOffsetY' | 'globalCompositeOperation'
	>,
): void => {
	if (shape.globalCompositeOperation !== undefined) {
		ctx.globalCompositeOperation = shape.globalCompositeOperation
	}

	if (shape.shadowColor !== undefined) {
		ctx.shadowColor = shape.shadowColor
	}
	if (shape.shadowBlur !== undefined) {
		ctx.shadowBlur = shape.shadowBlur
	}
	if (shape.shadowOffsetX !== undefined) {
		ctx.shadowOffsetX = shape.shadowOffsetX
	}
	if (shape.shadowOffsetY !== undefined) {
		ctx.shadowOffsetY = shape.shadowOffsetY
	}
}
