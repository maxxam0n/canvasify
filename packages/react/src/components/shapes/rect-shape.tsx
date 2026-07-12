import { useMemo } from 'react'
import { RectShape as CoreRectShape, type RectParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type RectProps = RectParams

export const RectShape = (props: RectProps) => {
	const shape = useMemo(() => new CoreRectShape(props), [
		props.x,
		props.y,
		props.width,
		props.height,
		props.opacity,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
		props.zIndex,
	])

	useShape(shape)

	return null
}
