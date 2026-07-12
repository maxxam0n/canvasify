import { useMemo } from 'react'
import { EllipseShape as CoreEllipseShape, type EllipseParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type EllipseProps = EllipseParams

export const EllipseShape = (props: EllipseProps) => {
	const shape = useMemo(() => new CoreEllipseShape(props), [
		props.cx,
		props.cy,
		props.radiusX,
		props.radiusY,
		props.opacity,
		props.rotation,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
		props.zIndex,
	])

	useShape(shape)

	return null
}
