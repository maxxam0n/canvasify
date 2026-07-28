import { memo } from 'react'
import { TextShape as CoreTextShape, type TextParams } from '@maxxam0n/canvasify-core'

import {
	splitShapeInteractionProps,
	useManagedShape,
	type ShapeConstructorProps,
	type ShapeInteractionProps,
} from '../../hooks/use-shape'

export type TextProps = TextParams & ShapeInteractionProps

const createTextShape = (props: ShapeConstructorProps<TextProps>) => new CoreTextShape(props)

const TextShapeComponent = (props: TextProps) => {
	const [shapeProps, interactionOptions] = splitShapeInteractionProps(props)

	useManagedShape(shapeProps, createTextShape, interactionOptions)

	return null
}

export const TextShape = memo(TextShapeComponent)

TextShape.displayName = 'TextShape'
