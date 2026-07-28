import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import type { StrokeStyle } from '../../model/stroke.types'
import { resolvePaint } from '../../lib/paint'
import { getStrokeHitMode, hitTestEllipse } from '../../lib/hit-test.utils'
import { applyStrokeStyle, pickStrokeStyleMeta } from '../../lib/stroke-style'

/**
 * Parameters for creating an ellipse shape.
 */
export interface EllipseParams extends StrokeStyle {
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
	/** Fill paint (CSS color or gradient). If not provided, the ellipse will not be filled. */
	fillColor?: Paint
	/** Stroke paint (CSS color or gradient). If not provided, the ellipse will not be stroked. */
	strokeColor?: Paint
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** Дополнительная ширина зоны попадания по обводке (px). */
	hitStrokeWidth?: number
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
	private fillColor?: Paint
	private strokeColor?: Paint
	private lineWidth: number
	private lineCap?: CanvasLineCap
	private lineJoin?: CanvasLineJoin
	private lineDash?: number[]
	private lineDashOffset?: number
	private hitStrokeWidth?: number
	private zIndex: number

	constructor({
		cx = 0,
		cy = 0,
		radiusX,
		radiusY,
		opacity = 1,
		rotation = 0,
		fillColor,
		strokeColor,
		lineWidth = 1,
		lineCap,
		lineJoin,
		lineDash,
		lineDashOffset,
		hitStrokeWidth,
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
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.lineDash = lineDash
		this.lineDashOffset = lineDashOffset
		this.hitStrokeWidth = hitStrokeWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath()
		ctx.ellipse(this.cx, this.cy, this.radiusX, this.radiusY, this.rotation, 0, Math.PI * 2)

		if (this.fillColor) {
			ctx.fillStyle = resolvePaint(ctx, this.fillColor)
			ctx.fill()
		}
		if (this.strokeColor && this.lineWidth > 0) {
			ctx.strokeStyle = resolvePaint(ctx, this.strokeColor)
			applyStrokeStyle(ctx, {
				lineWidth: this.lineWidth,
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			})
			ctx.stroke()
		}
	}

	public contains(x: number, y: number, hitStrokeWidth = this.hitStrokeWidth): boolean {
		const mode = getStrokeHitMode(this.fillColor, this.strokeColor, this.lineWidth, hitStrokeWidth)
		return hitTestEllipse(x, y, this.cx, this.cy, this.radiusX, this.radiusY, this.rotation, mode)
	}

	public getLocalBounds(): Rect {
		const mode = getStrokeHitMode(
			this.fillColor,
			this.strokeColor,
			this.lineWidth,
			this.hitStrokeWidth,
		)
		const pad = mode.hasStroke ? mode.halfStroke + mode.hitPad : 0
		const rx = this.radiusX + pad
		const ry = this.radiusY + pad
		const cos = Math.cos(this.rotation)
		const sin = Math.sin(this.rotation)
		// AABB повёрнутого эллипса
		const extentX = Math.hypot(rx * cos, ry * sin)
		const extentY = Math.hypot(rx * sin, ry * cos)
		return {
			x: this.cx - extentX,
			y: this.cy - extentY,
			width: extentX * 2,
			height: extentY * 2,
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
			...pickStrokeStyleMeta({
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			}),
		}
	}
}
