import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import type { StrokeStyle } from '../../model/stroke.types'
import { resolvePaint } from '../../lib/paint'
import { getStrokeHitMode, hitTestRect } from '../../lib/hit-test.utils'
import { applyStrokeStyle, pickStrokeStyleMeta } from '../../lib/stroke-style'

/**
 * Parameters for creating a rectangle shape.
 */
export type RectParams = StrokeStyle & {
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
	/** Fill paint (CSS color or gradient). If not provided, the rectangle will not be filled. */
	fillColor?: Paint
	/** Stroke paint (CSS color or gradient). If not provided, the rectangle will not be stroked. */
	strokeColor?: Paint
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** Дополнительная ширина зоны попадания по обводке (px). */
	hitStrokeWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

export class RectShape implements BaseShape {
	private x: number
	private y: number
	private width: number
	private height: number
	private opacity: number
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
		x = 0,
		y = 0,
		width,
		height,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
		lineCap,
		lineJoin,
		lineDash,
		lineDashOffset,
		hitStrokeWidth,
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
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.lineDash = lineDash
		this.lineDashOffset = lineDashOffset
		this.hitStrokeWidth = hitStrokeWidth
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		const { fillColor, strokeColor, lineWidth, x, y, width, height } = this

		if (fillColor) {
			ctx.fillStyle = resolvePaint(ctx, fillColor)
			ctx.fillRect(x, y, width, height)
		}

		if (strokeColor && lineWidth > 0) {
			ctx.strokeStyle = resolvePaint(ctx, strokeColor)
			applyStrokeStyle(ctx, {
				lineWidth,
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			})
			ctx.strokeRect(x, y, width, height)
		}
	}

	public contains(x: number, y: number, hitStrokeWidth = this.hitStrokeWidth): boolean {
		const mode = getStrokeHitMode(this.fillColor, this.strokeColor, this.lineWidth, hitStrokeWidth)
		return hitTestRect(x, y, { x: this.x, y: this.y, width: this.width, height: this.height }, mode)
	}

	public getLocalBounds(): Rect {
		const mode = getStrokeHitMode(
			this.fillColor,
			this.strokeColor,
			this.lineWidth,
			this.hitStrokeWidth,
		)
		const pad = mode.hasStroke ? mode.halfStroke + mode.hitPad : 0
		return {
			x: this.x - pad,
			y: this.y - pad,
			width: this.width + pad * 2,
			height: this.height + pad * 2,
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
			...pickStrokeStyleMeta({
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			}),
		}
	}
}
