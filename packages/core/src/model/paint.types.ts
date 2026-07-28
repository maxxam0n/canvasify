/**
 * Цветовая остановка градиента.
 */
export type ColorStop = {
	/** Позиция остановки в диапазоне 0..1. */
	offset: number
	/** CSS-цвет. */
	color: string
}

/**
 * Линейный градиент в координатах shape.
 */
export type LinearGradientPaint = {
	type: 'linear-gradient'
	x0: number
	y0: number
	x1: number
	y1: number
	stops: ColorStop[]
}

/**
 * Радиальный градиент в координатах shape.
 */
export type RadialGradientPaint = {
	type: 'radial-gradient'
	x0: number
	y0: number
	r0: number
	x1: number
	y1: number
	r1: number
	stops: ColorStop[]
}

/**
 * Паттерн-заливка на основе изображения.
 */
export type PatternPaint = {
	type: 'pattern'
	image: CanvasImageSource
	repetition?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
}

/**
 * Заливка или обводка: CSS-цвет, градиент либо паттерн.
 */
export type Paint = string | LinearGradientPaint | RadialGradientPaint | PatternPaint
