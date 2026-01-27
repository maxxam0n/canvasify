import type { RenderLayer } from '@maxxam0n/canvasify-core'

export interface LayerProps {
	name: string
	opacity?: number
	zIndex?: number
	renderer?: RenderLayer
}
