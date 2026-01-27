import { createContext } from 'react'
import type { GroupParams } from '@maxxam0n/canvasify-core'

export const GroupContext = createContext<GroupParams | null>(null)
