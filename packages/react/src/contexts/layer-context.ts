import { createContext } from 'react'
import type { Layer } from '@maxxam0n/canvasify-core'

export const LayerContext = createContext<Layer | null | undefined>(undefined)
