/**
 * Результат hit-test по фигуре внутри слоя.
 */
export type HitTestResult = {
	/** Id ShapeDrawingContext. */
	shapeId: string
	/** Метаданные фигуры. */
	meta: { [key: string]: unknown }
	/** zIndex фигуры (с учётом group). */
	zIndex: number
}

/**
 * Результат hit-test по всему Canvas (несколько слоёв).
 */
export type CanvasHitTestResult = HitTestResult & {
	/** Имя слоя, в котором найдена фигура. */
	layerName: string
}
