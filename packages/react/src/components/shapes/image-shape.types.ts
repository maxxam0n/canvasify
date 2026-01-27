export interface ImageProps {
	src: string
	x?: number
	y?: number
	opacity?: number
	width?: number
	height?: number
	zIndex?: number
	onReady?: () => void
}
