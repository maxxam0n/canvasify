export const CANVAS_TOKENS = {
	CANVAS: 'canvas',
	WIDTH: 'width',
	HEIGHT: 'height',
	LAYER: 'layer',
	TRANSFORMS: 'transforms',
	GROUP: 'group',
} as const

export type CanvasToken = (typeof CANVAS_TOKENS)[keyof typeof CANVAS_TOKENS]
