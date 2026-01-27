import { ensureFontIsReady } from '../../lib/font.utils'

import type { BaseShape, ShapeParams } from '../../model/shape.types'

export interface TextParams {
	x?: number
	y?: number
	text: string | number
	opacity?: number
	font?: string
	textAlign?: CanvasTextAlign
	textBaseline?: CanvasTextBaseline
	direction?: CanvasDirection
	maxWidth?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
	zIndex?: number
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
