import { useMemo } from 'react'
import { LineShape as CoreLineShape, type LineParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type LineProps = LineParams

export const LineShape = (props: LineProps) => {
	const shape = useMemo(() => new CoreLineShape(props), [
		props.x1,
		props.y1,
		props.x2,
		props.y2,
		props.opacity,
		props.strokeColor,
		props.lineWidth,
		props.zIndex,
	])

	useShape(shape)

	return null
}
