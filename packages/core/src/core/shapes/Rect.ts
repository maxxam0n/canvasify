import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { RectParams } from './Rect.types'

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
