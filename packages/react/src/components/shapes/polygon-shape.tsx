import { useMemo } from 'react'
import { PolygonShape as CorePolygonShape, type Point } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface PolygonProps {
	points: Point[]
	closed?: boolean
	zIndex?: number
	opacity?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
}

export const PolygonShape = ({
	points,
	closed,
	zIndex = 0,
	opacity = 1,
	fillColor,
	strokeColor,
	lineWidth = 1,
}: PolygonProps) => {
	const shape = useMemo(
		() =>
			new CorePolygonShape({
				points,
				closed,
				zIndex,
				opacity,
				fillColor,
				strokeColor,
				lineWidth,
			}),
		[points, closed, zIndex, opacity, fillColor, strokeColor, lineWidth],
	)

	useShape(shape)

	return null
}
