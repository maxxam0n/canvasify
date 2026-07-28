export const CANVAS_TOKENS = {
	CANVAS: 'canvas',
	WIDTH: 'width',
	HEIGHT: 'height',
	VIEWPORT: 'viewport',
	PIXEL_RATIO: 'pixelRatio',
	MAX_PIXEL_COUNT: 'maxPixelCount',
	LAYER: 'layer',
	TRANSFORMS: 'transforms',
	GROUP: 'group',
} as const

export type CanvasToken = (typeof CANVAS_TOKENS)[keyof typeof CANVAS_TOKENS]
