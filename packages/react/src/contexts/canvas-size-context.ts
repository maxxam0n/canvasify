import { createContext } from 'react'
import type { CanvasSize } from './canvas-size-context.types'

export const CanvasSizeContext = createContext<CanvasSize | null>(null)
