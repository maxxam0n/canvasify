import { useMemo } from 'react'
import { PolygonShape as CorePolygonShape, type PolygonParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type PolygonProps = PolygonParams & ShapeInteractionProps

export const PolygonShape = (props: PolygonProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CorePolygonShape(shapeProps), [
		shapeProps.points,
		shapeProps.closed,
		shapeProps.zIndex,
		shapeProps.opacity,
		shapeProps.fillColor,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
	])

	useShape(shape, interactionOptions)

	return null
}
