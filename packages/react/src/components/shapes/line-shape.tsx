import { memo } from 'react'
import { LineShape as CoreLineShape, type LineParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type LineProps = LineParams & ShapeInteractionProps

const createLineShape = (props: ShapeConstructorProps<LineProps>) => new CoreLineShape(props)

const LineShapeComponent = (props: LineProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createLineShape, interactionOptions)

	return null
}

export const LineShape = memo(LineShapeComponent)

LineShape.displayName = 'LineShape'
