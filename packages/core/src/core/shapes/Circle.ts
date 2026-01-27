import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { CircleParams } from './Circle.types'

export class CircleShape implements BaseShape {
	private radius: number
	private cx: number
	private cy: number
	private opacity: number
	private fillColor?: string
	private strokeColor?: string
	private lineWidth: number
	private zIndex: number

	constructor({
		radius,
		cx = 0,
		cy = 0,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
		zIndex = 0,
	}: CircleParams) {
		this.radius = radius
		this.cx = cx
		this.cy = cy
		this.opacity = opacity
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath()
		ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2)

		if (this.fillColor) {
			ctx.fillStyle = this.fillColor
			ctx.fill()
		}

		if (this.strokeColor && this.lineWidth > 0) {
			ctx.strokeStyle = this.strokeColor
			ctx.lineWidth = this.lineWidth
			ctx.stroke()
		}
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			radius: this.radius,
			cx: this.cx,
			cy: this.cy,
			fillColor: this.fillColor,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
		}
	}
}
