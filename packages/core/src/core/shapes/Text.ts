import { ensureFontIsReady } from '../../lib/font.utils'

import type { BaseShape, ShapeParams } from '../../model/shape.types'

/**
 * Parameters for creating a text shape.
 */
export interface TextParams {
	/** The x-coordinate of the text anchor point. Defaults to 0. */
	x?: number
	/** The y-coordinate of the text anchor point. Defaults to 0. */
	y?: number
	/** The text content to display. Numbers will be converted to strings. */
	text: string | number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** CSS font string (e.g., '16px sans-serif'). Defaults to '16px sans-serif'. */
	font?: string
	/** Text alignment relative to the anchor point. Defaults to 'start'. */
	textAlign?: CanvasTextAlign
	/** Text baseline alignment. Defaults to 'alphabetic'. */
	textBaseline?: CanvasTextBaseline
	/** Text direction. Defaults to 'inherit'. */
	direction?: CanvasDirection
	/** Maximum width in pixels. If specified, text will be constrained to this width. */
	maxWidth?: number
	/** Fill color as a CSS color string. If not provided, the text will not be filled. */
	fillColor?: string
	/** Stroke color as a CSS color string. If not provided, the text will not be stroked. */
	strokeColor?: string
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
	/** Callback function invoked when the font has finished loading. */
	onReady?: () => void
}

export class TextShape implements BaseShape {
	private x: number
	private y: number
	private text: string
	private opacity: number
	private font: string
	private textAlign: CanvasTextAlign
	private textBaseline: CanvasTextBaseline
	private direction: CanvasDirection
	private maxWidth?: number
	private fillColor?: string
	private strokeColor?: string
	private lineWidth: number
	private zIndex: number
	private onReady?: () => void

	constructor({
		x = 0,
		y = 0,
		text,
		opacity = 1,
		font = '16px sans-serif',
		textAlign = 'start',
		textBaseline = 'alphabetic',
		direction = 'inherit',
		fillColor,
		strokeColor,
		lineWidth = 1,
		maxWidth,
		zIndex = 0,
		onReady,
	}: TextParams) {
		this.x = x
		this.y = y
		this.text = text.toString()
		this.opacity = opacity
		this.font = font
		this.textAlign = textAlign
		this.textBaseline = textBaseline
		this.direction = direction
		this.maxWidth = maxWidth
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.zIndex = zIndex
		this.onReady = onReady

		ensureFontIsReady(font).then(() => {
			this.onReady?.()
		})
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.font = this.font
		ctx.textAlign = this.textAlign
		ctx.textBaseline = this.textBaseline
		ctx.direction = this.direction

		// Отрисовка с заливкой
		if (this.fillColor) {
			ctx.fillStyle = this.fillColor
			if (this.maxWidth !== undefined) {
				ctx.fillText(this.text, this.x, this.y, this.maxWidth)
			} else {
				ctx.fillText(this.text, this.x, this.y)
			}
		}

		// Отрисовка с обводкой
		if (this.strokeColor && this.lineWidth > 0) {
			ctx.strokeStyle = this.strokeColor
			ctx.lineWidth = this.lineWidth
			if (this.maxWidth !== undefined) {
				ctx.strokeText(this.text, this.x, this.y, this.maxWidth)
			} else {
				ctx.strokeText(this.text, this.x, this.y)
			}
		}
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			x: this.x,
			y: this.y,
			text: this.text,
			font: this.font,
			textAlign: this.textAlign,
			textBaseline: this.textBaseline,
		}
	}
}
