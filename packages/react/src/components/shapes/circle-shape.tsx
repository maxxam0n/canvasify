import { useMemo } from 'react'
import { CircleShape as CoreCircleShape, type CircleParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type CircleProps = CircleParams & ShapeInteractionProps

export const CircleShape = (props: CircleProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreCircleShape(shapeProps), [
		shapeProps.radius,
		shapeProps.cx,
		shapeProps.cy,
		shapeProps.opacity,
		shapeProps.fillColor,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
		shapeProps.zIndex,
		shapeProps.hitStrokeWidth,
	])

	useShape(shape, interactionOptions)

	return null
}
