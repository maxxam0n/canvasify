import { useMemo } from 'react'
import { LineShape as CoreLineShape, type LineParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type LineProps = LineParams & ShapeInteractionProps

export const LineShape = (props: LineProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreLineShape(shapeProps), [
		shapeProps.x1,
		shapeProps.y1,
		shapeProps.x2,
		shapeProps.y2,
		shapeProps.opacity,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
		shapeProps.zIndex,
	])

	useShape(shape, interactionOptions)

	return null
}
