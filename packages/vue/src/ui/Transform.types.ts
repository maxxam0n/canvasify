import type { RotationParams, ScaleParams, TranslateParams } from '@maxxam0n/canvasify-core'

export interface TransformProps {
	translate?: Omit<TranslateParams, 'type'>
	scale?: Omit<ScaleParams, 'type'>
	rotate?: Omit<RotationParams, 'type'>
}
