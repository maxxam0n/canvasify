import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Point } from '../../model/types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import type { StrokeStyle } from '../../model/stroke.types'
import { resolvePaint } from '../../lib/paint'
import { distanceToSegment, pointInPolygon } from '../../lib/hit-test.utils'
import { applyStrokeStyle, pickStrokeStyleMeta } from '../../lib/stroke-style'
import { aabbFromPoints } from '../../lib/rect.utils'

/**
 * Parameters for creating a polygon shape.
 */
export interface PolygonParams extends StrokeStyle {
	/** Array of points defining the polygon vertices. */
	points: Point[]
	/** Whether the polygon should be closed (connect last point to first). If not specified, defaults to true when fillColor is provided. */
	closed?: boolean
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Fill paint (CSS color or gradient). If provided, the polygon will be filled. */
	fillColor?: Paint
	/** Stroke paint (CSS color or gradient). If not provided, the polygon will not be stroked. */
	strokeColor?: Paint
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
}

export class PolygonShape implements BaseShape {
	private points: Point[]
	private closed?: boolean
	private zIndex: number
	private opacity: number
	private fillColor?: Paint
	private strokeColor?: Paint
	private lineWidth: number
	private lineCap?: CanvasLineCap
	private lineJoin?: CanvasLineJoin
	private lineDash?: number[]
	private lineDashOffset?: number

	constructor({
		points,
		closed,
		zIndex = 0,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
		lineCap,
		lineJoin,
		lineDash,
		lineDashOffset,
	}: PolygonParams) {
		this.points = points
		this.closed = closed
		this.zIndex = zIndex
		this.opacity = opacity
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.lineDash = lineDash
		this.lineDashOffset = lineDashOffset
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

	public contains(x: number, y: number): boolean {
		if (!this.points || this.points.length < 2) return false

		if (this.isClosed && this.fillColor && pointInPolygon(x, y, this.points)) {
			return true
		}

		if (this.strokeColor && this.lineWidth > 0) {
			const threshold = this.lineWidth / 2
			for (let i = 1; i < this.points.length; i++) {
				const a = this.points[i - 1]
				const b = this.points[i]
				if (distanceToSegment(x, y, a.x, a.y, b.x, b.y) <= threshold) return true
			}
			if (this.isClosed && this.points.length >= 3) {
				const first = this.points[0]
				const last = this.points[this.points.length - 1]
				if (distanceToSegment(x, y, last.x, last.y, first.x, first.y) <= threshold) return true
			}
		}

		return false
	}

	public getLocalBounds(): Rect | undefined {
		if (!this.points || this.points.length === 0) return undefined
		const pad = this.strokeColor && this.lineWidth > 0 ? this.lineWidth / 2 : 0
		const bounds = aabbFromPoints(this.points)
		return {
			x: bounds.x - pad,
			y: bounds.y - pad,
			width: bounds.width + pad * 2,
			height: bounds.height + pad * 2,
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
			...pickStrokeStyleMeta({
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			}),
		}
	}
}
