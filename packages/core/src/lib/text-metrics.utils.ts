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
	wrap?: boolean
	lineHeight?: number
	/** Доп. padding (например половина stroke). */
	padding?: number
	/** Fallback font size, если measureText недоступен. */
	fallbackFontSize?: number
}

export type LayoutTextLinesParams = {
	text: string
	font: string
	wrap?: boolean
	maxWidth?: number
	lineHeight?: number
	fallbackFontSize?: number
}

export type TextLineLayout = {
	lines: string[]
	width: number
	height: number
	lineHeight: number
}

const DEFAULT_LINE_HEIGHT_RATIO = 1.2

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

const resolveLineHeight = (lineHeight: number | undefined, fontSize: number): number =>
	lineHeight ?? fontSize * DEFAULT_LINE_HEIGHT_RATIO

const estimateTextWidth = (text: string, fontSize: number): number =>
	Math.max(fontSize * 0.6 * text.length, fontSize)

const splitHardLines = (text: string): string[] => text.split('\n')

const measureLineWidth = (text: string, font: string, fallbackFontSize: number): number => {
	const ctx = getMeasureContext()
	if (ctx) {
		ctx.font = font
		return ctx.measureText(text).width
	}
	return estimateTextWidth(text, fallbackFontSize)
}

const wrapLineToWidth = (
	line: string,
	maxWidth: number,
	measure: (text: string) => number,
): string[] => {
	if (line === '') return ['']
	if (maxWidth <= 0) return [line]

	const words = line.split(/\s+/).filter(word => word.length > 0)
	if (words.length === 0) return ['']

	const wrapped: string[] = []
	let current = ''

	const pushLongToken = (token: string) => {
		let chunk = ''
		for (const char of token) {
			const candidate = chunk + char
			if (chunk.length > 0 && measure(candidate) > maxWidth) {
				wrapped.push(chunk)
				chunk = char
			} else {
				chunk = candidate
			}
		}
		if (chunk.length > 0) wrapped.push(chunk)
	}

	for (const word of words) {
		const candidate = current.length > 0 ? `${current} ${word}` : word
		if (measure(candidate) <= maxWidth) {
			current = candidate
			continue
		}

		if (current.length > 0) {
			wrapped.push(current)
			current = ''
		}

		if (measure(word) <= maxWidth) {
			current = word
		} else {
			pushLongToken(word)
		}
	}

	if (current.length > 0) wrapped.push(current)
	return wrapped.length > 0 ? wrapped : ['']
}

/**
 * Разбивает текст на визуальные строки: жёсткие переносы по `\n`,
 * опциональный word-wrap при wrap=true и заданном maxWidth.
 */
export const layoutTextLines = (params: LayoutTextLinesParams): TextLineLayout => {
	const {
		text,
		font,
		wrap = false,
		maxWidth,
		lineHeight,
		fallbackFontSize = parseFontSize(font),
	} = params

	const resolvedLineHeight = resolveLineHeight(lineHeight, fallbackFontSize)
	const hardLines = splitHardLines(text)
	const shouldWrap = wrap && maxWidth !== undefined

	const measure = (line: string) => measureLineWidth(line, font, fallbackFontSize)

	const lines = shouldWrap
		? hardLines.flatMap(line => wrapLineToWidth(line, maxWidth, measure))
		: hardLines

	const squeeze = !shouldWrap && maxWidth !== undefined
	const width = lines.reduce((max, line) => {
		const measured = measure(line)
		const lineWidth = squeeze ? Math.min(measured, maxWidth) : measured
		return Math.max(max, lineWidth)
	}, 0)

	const height = (lines.length > 0 ? lines.length : 1) * resolvedLineHeight

	return {
		lines,
		width,
		height,
		lineHeight: resolvedLineHeight,
	}
}

/**
 * Y-координаты строк относительно якоря (x, y).
 *
 * Якорь всегда относится ко всему текстовому блоку:
 * - top/hanging: y — верх первой строки, следующие вниз с шагом lineHeight;
 * - alphabetic: y — baseline первой строки, следующие вниз;
 * - middle: блок центрируется вокруг y по вертикали;
 * - bottom/ideographic: y — baseline последней строки, предыдущие выше.
 */
export const getTextLineYs = (
	anchorY: number,
	lineCount: number,
	lineHeight: number,
	textBaseline: CanvasTextBaseline,
): number[] => {
	if (lineCount <= 0) return []

	if (textBaseline === 'top' || textBaseline === 'hanging') {
		return Array.from({ length: lineCount }, (_, index) => anchorY + index * lineHeight)
	}

	if (textBaseline === 'bottom' || textBaseline === 'ideographic') {
		return Array.from(
			{ length: lineCount },
			(_, index) => anchorY - (lineCount - 1 - index) * lineHeight,
		)
	}

	if (textBaseline === 'middle') {
		const firstY = anchorY - ((lineCount - 1) * lineHeight) / 2
		return Array.from({ length: lineCount }, (_, index) => firstY + index * lineHeight)
	}

	return Array.from({ length: lineCount }, (_, index) => anchorY + index * lineHeight)
}

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

const unionRects = (rects: Rect[]): Rect => {
	if (rects.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 }
	}

	const left = Math.min(...rects.map(rect => rect.x))
	const top = Math.min(...rects.map(rect => rect.y))
	const right = Math.max(...rects.map(rect => rect.x + rect.width))
	const bottom = Math.max(...rects.map(rect => rect.y + rect.height))

	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
	}
}

const measureSingleLineRect = (
	line: string,
	x: number,
	y: number,
	font: string,
	textAlign: CanvasTextAlign,
	textBaseline: CanvasTextBaseline,
	direction: CanvasDirection,
	maxWidth: number | undefined,
	squeeze: boolean,
	padding: number,
	fallbackFontSize: number,
): Rect => {
	const ctx = getMeasureContext()
	if (ctx) {
		ctx.font = font
		ctx.textAlign = textAlign
		ctx.textBaseline = textBaseline
		ctx.direction = direction

		const metrics = ctx.measureText(line)
		let scaleX = 1
		if (squeeze && maxWidth !== undefined && metrics.width > 0 && metrics.width > maxWidth) {
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
			squeeze && maxWidth !== undefined ? Math.min(metrics.width, maxWidth) : metrics.width
		const height = fallbackFontSize * DEFAULT_LINE_HEIGHT_RATIO
		const { left, top } = textAnchorToTopLeft(x, y, width, height, textAlign, textBaseline)
		return {
			x: left - padding,
			y: top - padding,
			width: width + padding * 2,
			height: height + padding * 2,
		}
	}

	const measured = estimateTextWidth(line, fallbackFontSize)
	const width = squeeze && maxWidth !== undefined ? Math.min(measured, maxWidth) : measured
	const height = fallbackFontSize * DEFAULT_LINE_HEIGHT_RATIO
	const { left, top } = textAnchorToTopLeft(x, y, width, height, textAlign, textBaseline)
	return {
		x: left - padding,
		y: top - padding,
		width: width + padding * 2,
		height: height + padding * 2,
	}
}

/**
 * AABB текста в локальных координатах фигуры.
 * Использует тот же layout, что draw/hit-test: `\n`, wrap и squeeze без wrap.
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
		wrap = false,
		lineHeight,
		padding = 0,
		fallbackFontSize = parseFontSize(font),
	} = params

	const layout = layoutTextLines({
		text,
		font,
		wrap,
		maxWidth,
		lineHeight,
		fallbackFontSize,
	})

	if (layout.lines.length === 0) {
		return measureSingleLineRect(
			'',
			x,
			y,
			font,
			textAlign,
			textBaseline,
			direction,
			maxWidth,
			!wrap && maxWidth !== undefined,
			padding,
			fallbackFontSize,
		)
	}

	const squeeze = !wrap && maxWidth !== undefined
	const lineYs = getTextLineYs(y, layout.lines.length, layout.lineHeight, textBaseline)
	const lineRects = layout.lines.map((line, index) =>
		measureSingleLineRect(
			line,
			x,
			lineYs[index] ?? y,
			font,
			textAlign,
			textBaseline,
			direction,
			maxWidth,
			squeeze,
			padding,
			fallbackFontSize,
		),
	)

	return unionRects(lineRects)
}
