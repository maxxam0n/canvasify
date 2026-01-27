import type { BaseShape, ShapeParams } from '../../model/shape.types'

/**
 * Parameters for creating a rectangle shape.
 */
export type RectParams = {
	/** The x-coordinate of the top-left corner. Defaults to 0. */
	x?: number
	/** The y-coordinate of the top-left corner. Defaults to 0. */
	y?: number
	/** The width of the rectangle in pixels. */
	width: number
	/** The height of the rectangle in pixels. */
	height: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Fill color as a CSS color string. If not provided, the rectangle will not be filled. */
	fillColor?: string
	/** Stroke color as a CSS color string. If not provided, the rectangle will not be stroked. */
	strokeColor?: string
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

export class RectShape implements BaseShape {
	private x: number
	private y: number
	private width: number
	private height: number
	private opacity: number
	private fillColor?: string
	private strokeColor?: string
	private lineWidth: number
	private zIndex: number

	constructor({
		x = 0,
		y = 0,
		width,
		height,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
		zIndex = 0,
	}: RectParams) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
		this.opacity = opacity
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		const { fillColor, strokeColor, lineWidth, x, y, width, height } = this

		if (fillColor) {
			ctx.fillStyle = fillColor
			ctx.fillRect(x, y, width, height)
		}

		if (strokeColor && lineWidth > 0) {
			ctx.strokeStyle = strokeColor
			ctx.lineWidth = lineWidth
			ctx.strokeRect(x, y, width, height)
		}
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
			fillColor: this.fillColor,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
		}
	}
}
