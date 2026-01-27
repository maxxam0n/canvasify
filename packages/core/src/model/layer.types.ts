import type { RenderShapes, ShapeDrawingContext } from './shape.types'

export type LayerData = {
	shapes: Map<string, ShapeDrawingContext>
	opacity: number
}

export type RenderLayer = (
	ctx: CanvasRenderingContext2D,
	layerData: LayerData,
	renderShapes: RenderShapes,
) => void
