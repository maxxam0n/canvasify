import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import type { StrokeStyle } from '../../model/stroke.types'
import { resolvePaint } from '../../lib/paint'
import { distanceToSegment } from '../../lib/hit-test.utils'
import { applyStrokeStyle, pickStrokeStyleMeta } from '../../lib/stroke-style'

/**
 * Parameters for creating a line shape.
 */
export interface LineParams extends StrokeStyle {
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
	/** Stroke paint (CSS color or gradient). Required for the line to be visible. */
	strokeColor?: Paint
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
	private strokeColor?: Paint
	private lineWidth: number
	private lineCap?: CanvasLineCap
	private lineJoin?: CanvasLineJoin
	private lineDash?: number[]
	private lineDashOffset?: number
	private zIndex: number

	constructor({
		x1,
		y1,
		x2,
		y2,
		opacity = 1,
		strokeColor,
		lineWidth = 1,
		lineCap,
		lineJoin,
		lineDash,
		lineDashOffset,
		zIndex = 0,
	}: LineParams) {
		this.x1 = x1
		this.y1 = y1
		this.x2 = x2
		this.y2 = y2
		this.opacity = opacity
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.lineDash = lineDash
		this.lineDashOffset = lineDashOffset
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		// Рисуем только если есть цвет и толщина
		if (!this.strokeColor || this.lineWidth <= 0) return

		ctx.beginPath()
		ctx.moveTo(this.x1, this.y1)
		ctx.lineTo(this.x2, this.y2)
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

	public contains(x: number, y: number): boolean {
		if (!this.strokeColor || this.lineWidth <= 0) return false
		return distanceToSegment(x, y, this.x1, this.y1, this.x2, this.y2) <= this.lineWidth / 2
	}

	public getLocalBounds(): Rect {
		const pad = this.lineWidth / 2
		const minX = Math.min(this.x1, this.x2) - pad
		const minY = Math.min(this.y1, this.y2) - pad
		const maxX = Math.max(this.x1, this.x2) + pad
		const maxY = Math.max(this.y1, this.y2) + pad
		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		}
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
			...pickStrokeStyleMeta({
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			}),
		}
	}
}
