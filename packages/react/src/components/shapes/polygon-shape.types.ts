import type { Point } from '@maxxam0n/canvasify-core'

export interface PolygonProps {
	points: Point[]
	closed?: boolean
	zIndex?: number
	opacity?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
}
