import type { BaseShape, ShapeParams } from '../../model/shape.types'

/**
 * Parameters for creating an ellipse shape.
 */
export interface EllipseParams {
	/** The x-coordinate of the ellipse center. Defaults to 0. */
	cx?: number
	/** The y-coordinate of the ellipse center. Defaults to 0. */
	cy?: number
	/** The horizontal radius of the ellipse in pixels. */
	radiusX: number
	/** The vertical radius of the ellipse in pixels. */
	radiusY: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Rotation angle in radians. Defaults to 0. */
	rotation?: number
	/** Fill color as a CSS color string. Defaults to 'white'. */
	fillColor?: string
	/** Stroke color as a CSS color string. If not provided, the ellipse will not be stroked. */
	strokeColor?: string
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

export class EllipseShape implements BaseShape {
	private cx: number
	private cy: number
	private radiusX: number
	private radiusY: number
	private opacity: number
	private rotation: number
	private fillColor?: string
	private strokeColor?: string
	private lineWidth: number
	private zIndex: number

	constructor({
		cx = 0,
		cy = 0,
		radiusX,
		radiusY,
		opacity = 1,
		rotation = 0,
		fillColor = 'white',
		strokeColor,
		lineWidth = 1,
		zIndex = 0,
	}: EllipseParams) {
		this.cx = cx
		this.cy = cy
		this.radiusX = radiusX
		this.radiusY = radiusY
		this.opacity = opacity
		this.rotation = rotation
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath()
		ctx.ellipse(this.cx, this.cy, this.radiusX, this.radiusY, this.rotation, 0, Math.PI * 2)

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
			radiusX: this.radiusX,
			radiusY: this.radiusY,
			cx: this.cx,
			cy: this.cy,
			rotation: this.rotation,
			fillColor: this.fillColor,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
		}
	}
}
