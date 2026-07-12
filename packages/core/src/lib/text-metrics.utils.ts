import type { Rect } from '../model/rect.types'

export type MeasureTextBoundsParams = {
	text: string
	font: string
	x: number
	y: number
	textAlign: CanvasTextAlign
	textBaseline: CanvasTextBaseline
	direction?: CanvasDirection
	maxWidth?: number
	/** Доп. padding (например половина stroke). */
	padding?: number
	/** Fallback font size, если measureText недоступен. */
	fallbackFontSize?: number
}

let measureCtx: CanvasRenderingContext2D | null | undefined

const getMeasureContext = (): CanvasRenderingContext2D | null => {
	if (measureCtx !== undefined) return measureCtx
	if (typeof document === 'undefined') {
		measureCtx = null
		return null
	}

	const canvas = document.createElement('canvas')
	measureCtx = canvas.getContext('2d')
	return measureCtx
}

/** Сброс кеша measure-контекста (для тестов). */
export const resetTextMeasureContext = () => {
	measureCtx = undefined
}

const parseFontSize = (font: string): number => {
	const match = font.match(/(\d+(?:\.\d+)?)px/)
	return match ? Number(match[1]) : 16
}

const estimateTextWidth = (text: string, fontSize: number): number =>
	Math.max(fontSize * 0.6 * text.length, fontSize)

const textAnchorToTopLeft = (
	x: number,
	y: number,
	width: number,
	height: number,
	textAlign: CanvasTextAlign,
	textBaseline: CanvasTextBaseline,
): { left: number; top: number } => {
	let left = x
	if (textAlign === 'center') left = x - width / 2
	else if (textAlign === 'right' || textAlign === 'end') left = x - width

	let top = y
	if (textBaseline === 'middle') top = y - height / 2
	else if (textBaseline === 'top' || textBaseline === 'hanging') top = y
	else if (textBaseline === 'bottom' || textBaseline === 'ideographic') top = y - height
	else top = y - height * 0.8 // alphabetic — приблизительно

	return { left, top }
}

const hasActualBoundingBox = (
	metrics: TextMetrics,
): metrics is TextMetrics & {
	actualBoundingBoxAscent: number
	actualBoundingBoxDescent: number
	actualBoundingBoxLeft: number
	actualBoundingBoxRight: number
} =>
	typeof metrics.actualBoundingBoxAscent === 'number' &&
	typeof metrics.actualBoundingBoxDescent === 'number' &&
	typeof metrics.actualBoundingBoxLeft === 'number' &&
	typeof metrics.actualBoundingBoxRight === 'number'

/**
 * AABB текста в локальных координатах фигуры.
 * Предпочитает actualBoundingBox* из measureText, иначе — оценка по font-size.
 */
export const measureTextBounds = (params: MeasureTextBoundsParams): Rect => {
	const {
		text,
		font,
		x,
		y,
		textAlign,
		textBaseline,
		direction = 'inherit',
		maxWidth,
		padding = 0,
		fallbackFontSize = parseFontSize(font),
	} = params

	const ctx = getMeasureContext()
	if (ctx) {
		ctx.font = font
		ctx.textAlign = textAlign
		ctx.textBaseline = textBaseline
		ctx.direction = direction

		const metrics = ctx.measureText(text)
		let scaleX = 1
		if (maxWidth !== undefined && metrics.width > 0 && metrics.width > maxWidth) {
			scaleX = maxWidth / metrics.width
		}

		if (hasActualBoundingBox(metrics)) {
			const left = x - metrics.actualBoundingBoxLeft * scaleX
			const right = x + metrics.actualBoundingBoxRight * scaleX
			const top = y - metrics.actualBoundingBoxAscent
			const bottom = y + metrics.actualBoundingBoxDescent
			return {
				x: left - padding,
				y: top - padding,
				width: right - left + padding * 2,
				height: bottom - top + padding * 2,
			}
		}

		const width =
			maxWidth !== undefined ? Math.min(metrics.width, maxWidth) : metrics.width
		const height = fallbackFontSize * 1.2
		const { left, top } = textAnchorToTopLeft(x, y, width, height, textAlign, textBaseline)
		return {
			x: left - padding,
			y: top - padding,
			width: width + padding * 2,
			height: height + padding * 2,
		}
	}

	const width =
		maxWidth !== undefined
			? Math.min(estimateTextWidth(text, fallbackFontSize), maxWidth)
			: estimateTextWidth(text, fallbackFontSize)
	const height = fallbackFontSize * 1.2
	const { left, top } = textAnchorToTopLeft(x, y, width, height, textAlign, textBaseline)
	return {
		x: left - padding,
		y: top - padding,
		width: width + padding * 2,
		height: height + padding * 2,
	}
}
