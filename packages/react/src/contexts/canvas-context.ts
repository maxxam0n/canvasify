import { createContext } from 'react'
import type { Canvas } from '@maxxam0n/canvasify-core'

export const CanvasContext = createContext<Canvas | null>(null)
