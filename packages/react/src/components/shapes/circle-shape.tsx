import { memo } from 'react'
import { CircleShape as CoreCircleShape, type CircleParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type CircleProps = CircleParams & ShapeInteractionProps

const createCircleShape = (props: ShapeConstructorProps<CircleProps>) => new CoreCircleShape(props)

const CircleShapeComponent = (props: CircleProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createCircleShape, interactionOptions)

	return null
}

export const CircleShape = memo(CircleShapeComponent)

CircleShape.displayName = 'CircleShape'
