/**
 * Type of transformation that can be applied.
 */
export type TransformType = 'translate' | 'scale' | 'rotation' | 'skew' | 'matrix' | 'clip-rect'

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
 * Parameters for a skew (shear) transformation.
 */
export type SkewParams = {
	/** The type of transformation. */
	type: 'skew'
	/** Horizontal shear angle in radians. */
	skewX: number
	/** Vertical shear angle in radians. */
	skewY: number
	/** The x-coordinate of the skew origin point. Defaults to 0 if not specified. */
	originX?: number
	/** The y-coordinate of the skew origin point. Defaults to 0 if not specified. */
	originY?: number
}

/**
 * Parameters for an arbitrary 2D affine matrix transformation.
 * Matches CanvasRenderingContext2D.transform(a, b, c, d, e, f).
 */
export type MatrixParams = {
	/** The type of transformation. */
	type: 'matrix'
	a: number
	b: number
	c: number
	d: number
	e: number
	f: number
}

/**
 * Rectangular clip in the current transform space.
 */
export type ClipRectParams = {
	type: 'clip-rect'
	x: number
	y: number
	width: number
	height: number
}

/**
 * Union type representing any transformation (translate, scale, rotation, skew, matrix, or clip).
 */
export type Transform =
	| TranslateParams
	| ScaleParams
	| RotationParams
	| SkewParams
	| MatrixParams
	| ClipRectParams
