import { useMemo } from 'react'
import { ImageShape as CoreImageShape } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export interface ImageProps {
	src: string
	x?: number
	y?: number
	opacity?: number
	width?: number
	height?: number
	zIndex?: number
	onReady?: () => void
}

export const ImageShape = ({
	src,
	x = 0,
	y = 0,
	opacity = 1,
	width,
	height,
	zIndex = 0,
	onReady,
}: ImageProps) => {
	const shape = useMemo(
		() =>
			new CoreImageShape({
				src,
				x,
				y,
				opacity,
				width,
				height,
				zIndex,
				onReady,
			}),
		[src, x, y, opacity, width, height, zIndex, onReady],
	)

	useShape(shape)

	return null
}
