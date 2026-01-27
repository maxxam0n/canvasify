/**
 * Type of transformation that can be applied.
 */
export type TransformType = 'translate' | 'scale' | 'rotation'

/**
 * Parameters for a translation transformation.
 */
export type TranslateParams = {
	/** The type of transformation. */
	type: 'translate'
	/** The horizontal translation distance in pixels. */
	translateX: number
	/** The vertical translation distance in pixels. */
	translateY: number
}

/**
 * Parameters for a scaling transformation.
 */
export type ScaleParams = {
	/** The type of transformation. */
	type: 'scale'
	/** The horizontal scale factor. */
	scaleX: number
	/** The vertical scale factor. */
	scaleY: number
	/** The x-coordinate of the scaling origin point. Defaults to 0 if not specified. */
	originX?: number
	/** The y-coordinate of the scaling origin point. Defaults to 0 if not specified. */
	originY?: number
}

/**
 * Parameters for a rotation transformation.
 */
export type RotationParams = {
	/** The type of transformation. */
	type: 'rotation'
	/** The rotation angle in radians. */
	angle: number
	/** The x-coordinate of the rotation origin point. Defaults to 0 if not specified. */
	originX?: number
	/** The y-coordinate of the rotation origin point. Defaults to 0 if not specified. */
	originY?: number
}

/**
 * Union type representing any transformation (translate, scale, or rotation).
 */
export type Transform = TranslateParams | ScaleParams | RotationParams
