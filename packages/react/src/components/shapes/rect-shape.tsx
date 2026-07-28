import { memo } from 'react'
import { RectShape as CoreRectShape, type RectParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type RectProps = RectParams & ShapeInteractionProps

const createRectShape = (props: ShapeConstructorProps<RectProps>) => new CoreRectShape(props)

const RectShapeComponent = (props: RectProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createRectShape, interactionOptions)

	return null
}

export const RectShape = memo(RectShapeComponent)

RectShape.displayName = 'RectShape'
