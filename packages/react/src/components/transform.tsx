import { PropsWithChildren, useContext, useMemo } from 'react'
import type {
	ClipRectParams,
	MatrixParams,
	RotationParams,
	ScaleParams,
	SkewParams,
	Transform,
	TranslateParams,
} from '@maxxam0n/canvasify-core'

import { TransformContext } from '../contexts/transform-context'

export interface TransformGroupProps extends PropsWithChildren {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
	skew?: Omit<SkewParams, 'type'>
	matrix?: Omit<MatrixParams, 'type'>
	clipRect?: Omit<ClipRectParams, 'type'>
}

export const TransformGroup = ({
	translate,
	scale,
	rotate,
	skew,
	matrix,
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
		if (skew) {
			transforms.push({ type: 'skew', ...skew })
		}
		if (matrix) {
			transforms.push({ type: 'matrix', ...matrix })
		}
		if (clipRect) {
			transforms.push({ type: 'clip-rect', ...clipRect })
		}

		return transforms
	}, [translate, scale, rotate, skew, matrix, clipRect])

	const transforms = useMemo<Transform[]>(() => {
		return [...parentTransforms, ...localTransforms]
	}, [parentTransforms, localTransforms])

	return <TransformContext.Provider value={transforms}>{children}</TransformContext.Provider>
}
