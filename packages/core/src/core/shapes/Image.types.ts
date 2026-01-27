export interface ImageParams {
	src: string
	x?: number
	y?: number
	opacity?: number
	width?: number
	height?: number
	zIndex?: number
	onReady?: () => void
}

export type ImageStatus = 'loading' | 'loaded' | 'error'
