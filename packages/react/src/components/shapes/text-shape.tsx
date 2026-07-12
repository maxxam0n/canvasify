import { useMemo } from 'react'
import { TextShape as CoreTextShape, type TextParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type TextProps = TextParams

export const TextShape = (props: TextProps) => {
	const shape = useMemo(() => new CoreTextShape(props), [
		props.x,
		props.y,
		props.text,
		props.opacity,
		props.font,
		props.textAlign,
		props.textBaseline,
		props.direction,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
		props.maxWidth,
		props.zIndex,
		props.onReady,
	])

	useShape(shape)

	return null
}
