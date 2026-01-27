import { useMemo } from 'react'
import { RectShape as CoreRectShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface RectProps {
	x?: number
	y?: number
	width: number
	height: number
	opacity?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
	zIndex?: number
}

export const RectShape = ({
	x = 0,
	y = 0,
	width,
	height,
	opacity = 1,
	fillColor,
	strokeColor,
	lineWidth = 1,
	zIndex = 0,
}: RectProps) => {
	const shape = useMemo(
		() =>
			new CoreRectShape({
				x,
				y,
				width,
				height,
				opacity,
				fillColor,
				strokeColor,
				lineWidth,
				zIndex,
			}),
		[x, y, width, height, opacity, fillColor, strokeColor, lineWidth, zIndex],
	)

	useShape(shape)

	return null
}
