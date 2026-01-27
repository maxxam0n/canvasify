export type TransformType = 'translate' | 'scale' | 'rotation'

export type TranslateParams = {
	type: 'translate'
	translateX: number
	translateY: number
}

export type ScaleParams = {
	type: 'scale'
	scaleX: number
	scaleY: number
	originX?: number
	originY?: number
}

export type RotationParams = {
	type: 'rotation'
	angle: number
	originX?: number
	originY?: number
}

export type Transform = TranslateParams | ScaleParams | RotationParams
