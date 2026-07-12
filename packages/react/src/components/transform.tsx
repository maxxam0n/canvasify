import { PropsWithChildren, useContext, useMemo } from 'react'
import type {
	ClipRectParams,
	RotationParams,
	ScaleParams,
	Transform,
	TranslateParams,
} from '@maxxam0n/canvasify-core'

import { TransformContext } from '../contexts/transform-context'

export interface TransformGroupProps extends PropsWithChildren {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
	clipRect?: Omit<ClipRectParams, 'type'>
}

export const TransformGroup = ({
	translate,
	scale,
	rotate,
	clipRect,
	children,
}: TransformGroupProps) => {
	const parentTransforms = useContext(TransformContext)

	const localTransforms = useMemo<Transform[]>(() => {
		const transforms: Transform[] = []

		if (translate) {
			transforms.push({ type: 'translate', ...translate })
		}
		if (scale) {
			transforms.push({ type: 'scale', ...scale })
		}
		if (rotate) {
			transforms.push({ type: 'rotation', ...rotate })
		}
		if (clipRect) {
			transforms.push({ type: 'clip-rect', ...clipRect })
		}

		return transforms
	}, [translate, scale, rotate, clipRect])

	const transforms = useMemo<Transform[]>(() => {
		return [...parentTransforms, ...localTransforms]
	}, [parentTransforms, localTransforms])

	return <TransformContext.Provider value={transforms}>{children}</TransformContext.Provider>
}
