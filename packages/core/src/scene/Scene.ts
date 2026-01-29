import { Canvas } from '../core/Canvas'
import { Layer } from '../core/Layer'
import { createLayerHandle } from './LayerHandle'
import type { LayerHandle } from './scene.types'
import type { SceneOptions } from './scene.types'

const DEFAULT_LAYERS = ['default']

export class Scene {
	private readonly container: HTMLElement
	private readonly options: SceneOptions & { layers: string[] }
	private readonly canvas: Canvas
	private readonly layerHandles = new Map<string, LayerHandle>()
	private destroyed = false

	constructor(container: HTMLElement, options?: SceneOptions) {
		if (!options?.width || !options?.height) {
			throw new Error('Scene requires width and height in options')
		}

		this.container = container
		this.options = {
			width: options.width,
			height: options.height,
			background: options.background ?? 'transparent',
			layers: options.layers ?? DEFAULT_LAYERS,
		}

		this.canvas = new Canvas()

		const layerNames = this.options.layers ?? DEFAULT_LAYERS

		Object.assign(this.container.style, {
			position: 'relative',
			width: `${this.options.width}px`,
			height: `${this.options.height}px`,
			backgroundColor: this.options.background,
		})

		for (let i = 0; i < layerNames.length; i++) {
			const name = layerNames[i]
			const canvasEl = document.createElement('canvas')
			Object.assign(canvasEl.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				width: `${this.options.width}px`,
				height: `${this.options.height}px`,
				zIndex: String(i),
			})

			this.container.appendChild(canvasEl)

			const layer = new Layer({
				name,
				canvas: canvasEl,
				onDirty: () => this.canvas.requestRender(),
			})
			layer.setSize(this.options.width, this.options.height)
			this.canvas.setLayer(layer)

			this.layerHandles.set(name, createLayerHandle(layer))
		}
	}

	getLayer(name: string): LayerHandle | undefined {
		return this.layerHandles.get(name)
	}

	setSize(width: number, height: number): void {
		if (this.destroyed) return

		this.options.width = width
		this.options.height = height

		Object.assign(this.container.style, {
			width: `${width}px`,
			height: `${height}px`,
		})

		const layers = this.options.layers ?? DEFAULT_LAYERS
		for (const name of layers) {
			const layer = this.canvas.getLayer(name)
			if (layer) {
				layer.setSize(width, height)
			}
		}
	}

	render(): void {
		if (this.destroyed) return
		this.canvas.render()
	}

	requestRender(): void {
		if (this.destroyed) return
		this.canvas.requestRender()
	}

	toDataURL(options?: Parameters<Canvas['toDataURL']>[0]): string {
		if (this.destroyed) throw new Error('Scene is destroyed')
		return this.canvas.toDataURL(options)
	}

	async toBlob(options?: Parameters<Canvas['toBlob']>[0]): Promise<Blob> {
		if (this.destroyed) throw new Error('Scene is destroyed')
		return this.canvas.toBlob(options)
	}

	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true

		this.canvas.cancelRender()

		const layers = this.options.layers ?? DEFAULT_LAYERS
		for (const name of layers) {
			const layer = this.canvas.getLayer(name)
			if (layer) {
				layer.canvas.remove()
				this.canvas.deleteLayer(name)
			}
		}

		this.layerHandles.clear()
	}
}
