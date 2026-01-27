import { useMemo } from 'react'
import { CircleShape as CoreCircleShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface CircleProps {
	radius: number
	cx?: number
	cy?: number
	opacity?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
	zIndex?: number
}

export const CircleShape = ({
	radius,
	cx = 0,
	cy = 0,
	opacity = 1,
	fillColor,
	strokeColor,
	lineWidth = 1,
	zIndex = 0,
}: CircleProps) => {
	const shape = useMemo(
		() =>
			new CoreCircleShape({
				radius,
				cx,
				cy,
				opacity,
				fillColor,
				strokeColor,
				lineWidth,
				zIndex,
			}),
		[radius, cx, cy, opacity, fillColor, strokeColor, lineWidth, zIndex],
	)

	useShape(shape)

	return null
}
