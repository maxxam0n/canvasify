import { createContext } from 'react'
import type { Rect } from '@maxxam0n/canvasify-core'

export type CanvasSize = {
	width: number
	height: number
}

export type CanvasSurface = CanvasSize & {
	viewport: Rect | null
	pixelRatio?: number
	maxPixelCount?: number
}

export const CanvasSizeContext = createContext<CanvasSurface | null>(null)
