/**
 * A function that performs drawing operations on a canvas rendering context.
 * @param ctx - The 2D canvas rendering context to draw on.
 */
export type ContextHandler = (ctx: CanvasRenderingContext2D) => void

/**
 * Parameters for configuring a group of shapes.
 */
export type GroupParams = {
	/** The z-index for rendering order. Higher values are rendered on top. */
	zIndex: number
	/** The opacity value between 0 (transparent) and 1 (opaque). */
	opacity: number
}

/**
 * Represents a 2D point with x and y coordinates.
 */
export interface Point {
	/** The x-coordinate. */
	x: number
	/** The y-coordinate. */
	y: number
}
