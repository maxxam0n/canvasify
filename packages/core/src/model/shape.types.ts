import type { ContextHandler } from './types'

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
}

/**
 * Function that renders an array of shapes on a canvas context.
 * @param ctx - The 2D canvas rendering context to draw on.
 * @param shapes - Array of shape drawing contexts to render.
 */
export type RenderShapes = (ctx: CanvasRenderingContext2D, shapes: ShapeDrawingContext[]) => void
