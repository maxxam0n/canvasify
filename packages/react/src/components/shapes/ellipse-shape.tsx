import { useMemo } from 'react'
import { EllipseShape as CoreEllipseShape, type EllipseParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type EllipseProps = EllipseParams & ShapeInteractionProps

export const EllipseShape = (props: EllipseProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreEllipseShape(shapeProps), [
		shapeProps.cx,
		shapeProps.cy,
		shapeProps.radiusX,
		shapeProps.radiusY,
		shapeProps.opacity,
		shapeProps.rotation,
		shapeProps.fillColor,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
		shapeProps.zIndex,
		shapeProps.hitStrokeWidth,
	])

	useShape(shape, interactionOptions)

	return null
}
