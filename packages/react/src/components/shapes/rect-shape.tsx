import { useMemo } from 'react'
import { RectShape as CoreRectShape, type RectParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type RectProps = RectParams & ShapeInteractionProps

export const RectShape = (props: RectProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreRectShape(shapeProps), [
		shapeProps.x,
		shapeProps.y,
		shapeProps.width,
		shapeProps.height,
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
