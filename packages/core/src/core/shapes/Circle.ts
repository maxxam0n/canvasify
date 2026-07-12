import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import { resolvePaint } from '../../lib/paint'
import { pointInCircle } from '../../lib/hit-test.utils'

/**
 * Parameters for creating a circle shape.
 */
export interface CircleParams {
	/** The radius of the circle in pixels. */
	radius: number
	/** The x-coordinate of the circle center. Defaults to 0. */
	cx?: number
	/** The y-coordinate of the circle center. Defaults to 0. */
	cy?: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Fill paint (CSS color or gradient). If not provided, the circle will not be filled. */
	fillColor?: Paint
	/** Stroke paint (CSS color or gradient). If not provided, the circle will not be stroked. */
	strokeColor?: Paint
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

export class CircleShape implements BaseShape {
	private radius: number
	private cx: number
	private cy: number
	private opacity: number
	private fillColor?: Paint
	private strokeColor?: Paint
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
			ctx.fillStyle = resolvePaint(ctx, this.fillColor)
			ctx.fill()
		}

		if (this.strokeColor && this.lineWidth > 0) {
			ctx.strokeStyle = resolvePaint(ctx, this.strokeColor)
			ctx.lineWidth = this.lineWidth
			ctx.stroke()
		}
	}

	public contains(x: number, y: number): boolean {
		const radius =
			this.radius + (this.strokeColor && this.lineWidth > 0 ? this.lineWidth / 2 : 0)
		return pointInCircle(x, y, this.cx, this.cy, radius)
	}

	public getLocalBounds(): Rect {
		const radius =
			this.radius + (this.strokeColor && this.lineWidth > 0 ? this.lineWidth / 2 : 0)
		return {
			x: this.cx - radius,
			y: this.cy - radius,
			width: radius * 2,
			height: radius * 2,
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
