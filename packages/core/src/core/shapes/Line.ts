import type { BaseShape, ShapeParams } from '../../model/shape.types'

export interface LineParams {
	x1: number
	y1: number
	x2: number
	y2: number
	opacity?: number
	strokeColor?: string
	lineWidth?: number
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
