import type { Rect } from './rect.types'
import type { ContextHandler } from './types'
import type { Transform } from './transform.types'

/**
 * Basic parameters that apply to all shapes.
 */
export type ShapeParams = {
	/** The z-index for rendering order. Higher values are rendered on top. */
	zIndex: number
	/** The opacity value between 0 (transparent) and 1 (opaque). */
	opacity: number
}

/**
 * Complete context for drawing a shape, including its drawing function, transform function, and metadata.
 */
export type ShapeDrawingContext = {
	/** Unique identifier for the shape. */
	id: string
	/** Shape-specific parameters like z-index and opacity. */
	shapeParams: ShapeParams
	/** Additional metadata associated with the shape. */
	meta: { [key: string]: unknown }
	/** Function that draws the shape on the canvas context. */
	draw: ContextHandler
	/** Function that applies transformations to the canvas context before drawing. */
	transform: ContextHandler
	/** Transforms used for draw and hit-test (including clip-rect). */
	transforms?: Transform[]
	/**
	 * Hit-test в локальных координатах фигуры (после inverse transforms).
	 * Если не задан — фигура не участвует в hit-test.
	 */
	contains?: (x: number, y: number) => boolean
	/**
	 * Локальный AABB фигуры (без transforms).
	 * Нужен для dirty regions; если нет — слой помечается fully dirty.
	 */
	getLocalBounds?: () => Rect | undefined
}

/**
 * Base interface that all shape classes must implement.
 */
export type BaseShape = {
	/** Function that draws the shape on the canvas context. */
	draw: ContextHandler
	/** Shape-specific parameters like z-index and opacity. */
	shapeParams: ShapeParams
	/** Additional metadata associated with the shape. */
	meta: { [key: string]: unknown }
	/**
	 * Подписка на запрос перерисовки (например после загрузки изображения или шрифта).
	 * Возвращает функцию отписки.
	 */
	subscribeInvalidate?: (listener: () => void) => () => void
	/**
	 * Hit-test в локальных координатах фигуры.
	 * Если не реализован — фигура пропускается при hit-test.
	 */
	contains?: (x: number, y: number) => boolean
	/**
	 * Локальный AABB фигуры для dirty regions.
	 */
	getLocalBounds?: () => Rect | undefined
}

/**
 * Function that renders an array of shapes on a canvas context.
 * @param ctx - The 2D canvas rendering context to draw on.
 * @param shapes - Array of shape drawing contexts to render.
 */
export type RenderShapes = (ctx: CanvasRenderingContext2D, shapes: ShapeDrawingContext[]) => void
