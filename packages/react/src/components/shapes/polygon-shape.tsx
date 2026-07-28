import { memo } from 'react'
import { PolygonShape as CorePolygonShape, type PolygonParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type PolygonProps = PolygonParams & ShapeInteractionProps

const createPolygonShape = (props: ShapeConstructorProps<PolygonProps>) =>
	new CorePolygonShape(props)

const PolygonShapeComponent = (props: PolygonProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createPolygonShape, interactionOptions)

	return null
}

export const PolygonShape = memo(PolygonShapeComponent)

PolygonShape.displayName = 'PolygonShape'
