import { useMemo } from 'react'
import { PathShape as CorePathShape, type PathParams } from '@maxxam0n/canvasify-core'

import { useShape } from '../../hooks/use-shape'

export type PathProps = PathParams

export const PathShape = (props: PathProps) => {
	const shape = useMemo(() => new CorePathShape(props), [
		props.commands,
		props.opacity,
		props.fillColor,
		props.strokeColor,
		props.lineWidth,
		props.zIndex,
	])

	useShape(shape)

	return null
}
