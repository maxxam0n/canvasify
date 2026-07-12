/** Стиль обводки линии (подмножество Canvas stroke API). */
export type StrokeStyle = {
	lineCap?: CanvasLineCap
	lineJoin?: CanvasLineJoin
	lineDash?: number[]
	lineDashOffset?: number
}

/** Параметры обводки фигуры: толщина и стиль линии. */
export type ShapeStrokeParams = StrokeStyle & {
	lineWidth?: number
}
