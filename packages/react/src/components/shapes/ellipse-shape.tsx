import { useMemo } from 'react'
import { EllipseShape as CoreEllipseShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface EllipseProps {
	cx?: number
	cy?: number
	radiusX: number
	radiusY: number
	opacity?: number
	rotation?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
	zIndex?: number
}

export const EllipseShape = ({
	cx = 0,
	cy = 0,
	radiusX,
	radiusY,
	opacity = 1,
	rotation = 0,
	fillColor,
	strokeColor,
	lineWidth = 1,
	zIndex = 0,
}: EllipseProps) => {
	const shape = useMemo(
		() =>
			new CoreEllipseShape({
				cx,
				cy,
				radiusX,
				radiusY,
				opacity,
				rotation,
				fillColor,
				strokeColor,
				lineWidth,
				zIndex,
			}),
		[cx, cy, radiusX, radiusY, opacity, rotation, fillColor, strokeColor, lineWidth, zIndex],
	)

	useShape(shape)

	return null
}
