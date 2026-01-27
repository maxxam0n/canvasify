import type { Point } from '../../model/types'

export interface PolygonParams {
	points: Point[]
	closed?: boolean
	zIndex?: number
	opacity?: number
	fillColor?: string
	strokeColor?: string
	lineWidth?: number
}
