import { useMemo } from 'react'
import { ImageShape as CoreImageShape, type ImageParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type ImageProps = ImageParams & ShapeInteractionProps

export const ImageShape = (props: ImageProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreImageShape(shapeProps), [
		shapeProps.src,
		shapeProps.x,
		shapeProps.y,
		shapeProps.opacity,
		shapeProps.width,
		shapeProps.height,
		shapeProps.zIndex,
		shapeProps.onReady,
		shapeProps.onError,
	])

	useShape(shape, interactionOptions)

	return null
}
