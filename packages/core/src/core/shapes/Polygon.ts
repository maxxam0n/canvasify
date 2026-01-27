import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Point } from '../../model/types'

/**
 * Parameters for creating a polygon shape.
 */
export interface PolygonParams {
	/** Array of points defining the polygon vertices. */
	points: Point[]
	/** Whether the polygon should be closed (connect last point to first). If not specified, defaults to true when fillColor is provided. */
	closed?: boolean
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Fill color as a CSS color string. If provided, the polygon will be filled. */
	fillColor?: string
	/** Stroke color as a CSS color string. If not provided, the polygon will not be stroked. */
	strokeColor?: string
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
}

export class PolygonShape implements BaseShape {
	private points: Point[]
	private closed?: boolean
	private zIndex: number
	private opacity: number
	private fillColor?: string
	private strokeColor?: string
	private lineWidth: number

	constructor({
		points,
		closed,
		zIndex = 0,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
	}: PolygonParams) {
		this.points = points
		this.closed = closed
		this.zIndex = zIndex
		this.opacity = opacity
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
	}

	private get isClosed(): boolean {
		return this.closed ?? !!this.fillColor
	}

	public draw(ctx: CanvasRenderingContext2D) {
		// Для замкнутого нужно хотя бы 3 точки
		if (!this.points || this.points.length < (this.isClosed ? 3 : 2)) return

		ctx.beginPath()
		ctx.moveTo(this.points[0].x, this.points[0].y)

		for (let i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.points[i].x, this.points[i].y)
		}

		if (this.isClosed) {
			ctx.closePath()
		}

		if (this.fillColor && this.isClosed) {
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
			points: this.points,
			closed: this.closed,
			fillColor: this.fillColor,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
		}
	}
}
