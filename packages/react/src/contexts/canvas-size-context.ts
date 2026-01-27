import { createContext } from 'react'

export type CanvasSize = {
	width: number
	height: number
}

export const CanvasSizeContext = createContext<CanvasSize | null>(null)
