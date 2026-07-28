import { memo } from 'react'
import { ImageShape as CoreImageShape, type ImageParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type ImageProps = ImageParams & ShapeInteractionProps

const createImageShape = (props: ShapeConstructorProps<ImageProps>) => new CoreImageShape(props)

const ImageShapeComponent = (props: ImageProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createImageShape, interactionOptions)

	return null
}

export const ImageShape = memo(ImageShapeComponent)

ImageShape.displayName = 'ImageShape'
