import type { BaseShape, ShapeParams } from '../../model/shape.types'

/**
 * Parameters for creating a line shape.
 */
export interface LineParams {
	/** The x-coordinate of the start point. */
	x1: number
	/** The y-coordinate of the start point. */
	y1: number
	/** The x-coordinate of the end point. */
	x2: number
	/** The y-coordinate of the end point. */
	y2: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Stroke color as a CSS color string. Required for the line to be visible. */
	strokeColor?: string
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

export class LineShape implements BaseShape {
	private x1: number
	private y1: number
	private x2: number
	private y2: number
	private opacity: number
	private strokeColor?: string
	private lineWidth: number
	private zIndex: number

	constructor({ x1, y1, x2, y2, opacity = 1, strokeColor, lineWidth = 1, zIndex = 0 }: LineParams) {
		this.x1 = x1
		this.y1 = y1
		this.x2 = x2
		this.y2 = y2
		this.opacity = opacity
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		// Рисуем только если есть цвет и толщина
		if (!this.strokeColor || this.lineWidth <= 0) return

		ctx.beginPath()
		ctx.moveTo(this.x1, this.y1)
		ctx.lineTo(this.x2, this.y2)
		ctx.strokeStyle = this.strokeColor
		ctx.lineWidth = this.lineWidth
		ctx.stroke()
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			x1: this.x1,
			y1: this.y1,
			x2: this.x2,
			y2: this.y2,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
		}
	}
}
