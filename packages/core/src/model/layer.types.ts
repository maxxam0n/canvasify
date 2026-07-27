import type { RenderShapes, ShapeDrawingContext } from './shape.types'
import type { Rect } from './rect.types'

/**
 * Data structure containing all shapes and opacity for a layer.
 */
export type LayerData = {
	/** Map of shape IDs to their drawing contexts. */
	shapes: Map<string, ShapeDrawingContext>
	/** The opacity value between 0 (transparent) and 1 (opaque). */
	opacity: number
	/** Visible part of the layer in world coordinates. */
	viewport: Rect
	/** Full logical width of the layer in world coordinates. */
	worldWidth: number
	/** Full logical height of the layer in world coordinates. */
	worldHeight: number
	/** Coalesced dirty region for an incremental render, if available. */
	dirtyRegion?: Rect
	/** True when the target must be rendered from scratch. */
	fullRedraw: boolean
}

/**
 * Function that renders a layer on a canvas context.
 * @param ctx - The 2D canvas rendering context to draw on.
 * @param layerData - The layer data containing shapes and opacity.
 * @param renderShapes - Function to render the shapes in the layer.
 */
export type RenderLayer = (
	ctx: CanvasRenderingContext2D,
	layerData: LayerData,
	renderShapes: RenderShapes,
) => void
