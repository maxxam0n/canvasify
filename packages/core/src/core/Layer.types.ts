import type { RenderLayer } from '../model/layer.types'

export type LayerOptions = {
	name: string
	canvas: HTMLCanvasElement
	width?: number
	height?: number
	opacity?: number
	renderer?: RenderLayer
	onDirty?: () => void
}
