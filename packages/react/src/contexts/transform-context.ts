import { createContext } from 'react'
import type { Transform } from '@maxxam0n/canvasify-core'

export const TransformContext = createContext<Transform[]>([])
