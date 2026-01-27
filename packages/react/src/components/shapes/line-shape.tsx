import { useMemo } from 'react'
import { LineShape as CoreLineShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'
import type { LineProps } from './line-shape.types'

export const LineShape = ({
	x1,
	y1,
	x2,
	y2,
	opacity = 1,
	strokeColor,
	lineWidth = 1,
	zIndex = 0,
}: LineProps) => {
	const shape = useMemo(
		() =>
			new CoreLineShape({
				x1,
				y1,
				x2,
				y2,
				opacity,
				strokeColor,
				lineWidth,
				zIndex,
			}),
		[x1, y1, x2, y2, opacity, strokeColor, lineWidth, zIndex],
	)

	useShape(shape)

	return null
}
