import { useMemo } from 'react'
import { TextShape as CoreTextShape, type TextParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useShape,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type TextProps = TextParams & ShapeInteractionProps

export const TextShape = (props: TextProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	const shape = useMemo(() => new CoreTextShape(shapeProps), [
		shapeProps.x,
		shapeProps.y,
		shapeProps.text,
		shapeProps.opacity,
		shapeProps.font,
		shapeProps.textAlign,
		shapeProps.textBaseline,
		shapeProps.direction,
		shapeProps.fillColor,
		shapeProps.strokeColor,
		shapeProps.lineWidth,
		shapeProps.maxWidth,
		shapeProps.wrap,
		shapeProps.lineHeight,
		shapeProps.zIndex,
		shapeProps.onReady,
	])

	useShape(shape, interactionOptions)

	return null
}
