export type ContextHandler = (ctx: CanvasRenderingContext2D) => void

export type GroupParams = {
	zIndex: number
	opacity: number
}

export interface Point {
	x: number
	y: number
}
