import { memo } from 'react'
import { PathShape as CorePathShape, type PathParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type PathProps = PathParams & ShapeInteractionProps

const createPathShape = (props: ShapeConstructorProps<PathProps>) => new CorePathShape(props)

const PathShapeComponent = (props: PathProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createPathShape, interactionOptions)

	return null
}

export const PathShape = memo(PathShapeComponent)

PathShape.displayName = 'PathShape'
