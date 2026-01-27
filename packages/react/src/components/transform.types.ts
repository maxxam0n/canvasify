import type { PropsWithChildren } from 'react'
import type { RotationParams, ScaleParams, TranslateParams } from '@maxxam0n/canvasify-core'

export interface TransformGroupProps extends PropsWithChildren {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
}
