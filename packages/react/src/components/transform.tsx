import { PropsWithChildren, useContext, useMemo } from 'react'
import type {
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
}

export const TransformGroup = ({
	rotate: { angle, originX: rotateOriginX, originY: rotateOriginY } = {
		angle: 0,
	},
	scale: { scaleX, scaleY, originX: scaleOriginX, originY: scaleOriginY } = {
		scaleX: 1,
		scaleY: 1,
	},
	translate: { translateX, translateY } = {
		translateX: 0,
		translateY: 0,
	},
	children,
}: TransformGroupProps) => {
	const parentTransforms = useContext(TransformContext)

	const localTransforms = useMemo<Transform[]>(() => {
		return [
			{ type: 'translate', translateX, translateY },
			{
				type: 'scale',
				scaleX,
				scaleY,
				originX: scaleOriginX,
				originY: scaleOriginY,
			},
			{
				type: 'rotation',
				angle,
				originX: rotateOriginX,
				originY: rotateOriginY,
			},
		]
	}, [
		translateX,
		translateY,
		scaleX,
		scaleY,
		scaleOriginX,
		scaleOriginY,
		angle,
		rotateOriginX,
		rotateOriginY,
	])

	const transforms = useMemo<Transform[]>(() => {
		return [...parentTransforms, ...localTransforms]
	}, [parentTransforms, localTransforms])

	return <TransformContext.Provider value={transforms}>{children}</TransformContext.Provider>
}
