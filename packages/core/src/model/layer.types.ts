import type { RenderShapes, ShapeDrawingContext } from './shape.types'

/**
 * Data structure containing all shapes and opacity for a layer.
 */
export type LayerData = {
	/** Map of shape IDs to their drawing contexts. */
	shapes: Map<string, ShapeDrawingContext>
	/** The opacity value between 0 (transparent) and 1 (opaque). */
	opacity: number
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
