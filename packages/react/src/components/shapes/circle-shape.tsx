import { useMemo } from 'react'
import { CircleShape as CoreCircleShape, type CircleParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type CircleProps = CircleParams

export const CircleShape = (props: CircleProps) => {
	const shape = useMemo(() => new CoreCircleShape(props), [
		props.radius,
		props.cx,
		props.cy,
		props.opacity,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
		props.zIndex,
	])

	useShape(shape)

	return null
}
