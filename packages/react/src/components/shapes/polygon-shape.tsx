import { useMemo } from 'react'
import { PolygonShape as CorePolygonShape, type PolygonParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type PolygonProps = PolygonParams

export const PolygonShape = (props: PolygonProps) => {
	const shape = useMemo(() => new CorePolygonShape(props), [
		props.points,
		props.closed,
		props.zIndex,
		props.opacity,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
	])

	useShape(shape)

	return null
}
