import { useMemo } from 'react'
import { PolygonShape as CorePolygonShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'
import type { PolygonProps } from './polygon-shape.types'

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
