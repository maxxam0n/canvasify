import { memo } from 'react'
import { EllipseShape as CoreEllipseShape, type EllipseParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type EllipseProps = EllipseParams & ShapeInteractionProps

const createEllipseShape = (props: ShapeConstructorProps<EllipseProps>) =>
	new CoreEllipseShape(props)

const EllipseShapeComponent = (props: EllipseProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createEllipseShape, interactionOptions)

	return null
}

export const EllipseShape = memo(EllipseShapeComponent)

EllipseShape.displayName = 'EllipseShape'
