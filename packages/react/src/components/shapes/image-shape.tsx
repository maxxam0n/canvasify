import { useMemo } from 'react'
import { ImageShape as CoreImageShape, type ImageParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type ImageProps = ImageParams

export const ImageShape = (props: ImageProps) => {
	const shape = useMemo(() => new CoreImageShape(props), [
		props.src,
		props.x,
		props.y,
		props.opacity,
		props.width,
		props.height,
		props.zIndex,
		props.onReady,
	])

	useShape(shape)

	return null
}
