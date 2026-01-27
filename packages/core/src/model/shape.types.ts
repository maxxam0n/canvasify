import type { ContextHandler } from './types'

export type ShapeParams = {
	zIndex: number
	opacity: number
}

export type ShapeDrawingContext = {
	id: string
	shapeParams: ShapeParams
	meta: { [key: string]: unknown }
	draw: ContextHandler
	transform: ContextHandler
}

export type BaseShape = {
	draw: ContextHandler
	shapeParams: ShapeParams
	meta: { [key: string]: unknown }
}

export type RenderShapes = (ctx: CanvasRenderingContext2D, shapes: ShapeDrawingContext[]) => void
