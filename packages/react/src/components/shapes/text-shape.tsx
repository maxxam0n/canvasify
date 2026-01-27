import { useMemo } from 'react'
import { TextShape as CoreTextShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface TextProps {
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

export const TextShape = ({
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
}: TextProps) => {
	const shape = useMemo(
		() =>
			new CoreTextShape({
				x,
				y,
				text,
				opacity,
				font,
				textAlign,
				textBaseline,
				direction,
				fillColor,
				strokeColor,
				lineWidth,
				maxWidth,
				zIndex,
				onReady,
			}),
		[
			x,
			y,
			text,
			opacity,
			font,
			textAlign,
			textBaseline,
			direction,
			fillColor,
			strokeColor,
			lineWidth,
			maxWidth,
			zIndex,
			onReady,
		],
	)

	useShape(shape)

	return null
}
