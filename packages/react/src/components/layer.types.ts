import type { PropsWithChildren } from 'react'
import type { RenderLayer } from '@maxxam0n/canvasify-core'

export interface LayerProps extends PropsWithChildren {
	name: string
	opacity?: number
	zIndex?: number
	renderer?: RenderLayer
}
