export interface TextParams {
	x?: number
	y?: number
	text: string | number
	opacity?: number
	font?: string
	textAlign?: CanvasTextAlign
	textBaseline?: CanvasTextBaseline
	direction?: CanvasDirection
	maxWidth?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
	zIndex?: number
	onReady?: () => void
}
