import { useMemo } from 'react'
import { PathShape as CorePathShape, type PathParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type PathProps = PathParams & ShapeInteractionProps

export const PathShape = (props: PathProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CorePathShape(shapeProps), [
		shapeProps.commands,
		shapeProps.opacity,
		shapeProps.fillColor,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
		shapeProps.zIndex,
	])

	useShape(shape, interactionOptions)

	return null
}
