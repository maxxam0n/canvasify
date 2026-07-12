import { Canvas } from '../core/Canvas'
import { Layer } from '../core/Layer'
import { createPointerInteraction } from '../interaction/pointer-interaction'
import type { PointerInteraction } from '../interaction/pointer-interaction.types'
import { createLayerHandle } from './LayerHandle'
import type { LayerHandle, SceneInteractionHandlers, SceneOptions } from './scene.types'

const DEFAULT_LAYERS = ['default']

export class Scene {
	private readonly container: HTMLElement
	private readonly options: SceneOptions & { layers: string[] }
	private readonly canvas: Canvas
	private readonly layerHandles = new Map<string, LayerHandle>()
	private readonly pointerInteraction: PointerInteraction
	private destroyed = false

	constructor(container: HTMLElement, options?: SceneOptions) {
		if (
			typeof options?.width !== 'number' ||
			typeof options?.height !== 'number' ||
			!Number.isFinite(options.width) ||
			!Number.isFinite(options.height)
		) {
			throw new Error('Scene requires finite width and height in options')
		}

		if (options.width < 0 || options.height < 0) {
			throw new Error('Scene width and height must be non-negative')
		}

		this.container = container
		this.options = {
			width: options.width,
			height: options.height,
			background: options.background ?? 'transparent',
			layers: options.layers ?? DEFAULT_LAYERS,
			workerRenderer: options.workerRenderer,
			workerLayers: options.workerLayers,
		}

		this.canvas = new Canvas()
		this.canvas.setDefaultBackground(this.options.background)

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

			const useWorker =
				options.workerRenderer &&
				(!options.workerLayers || options.workerLayers.includes(name))

			const layer = new Layer({
				name,
				canvas: canvasEl,
				onDirty: () => this.canvas.requestRender(),
				zIndex: i,
				...(useWorker ? { workerRenderer: options.workerRenderer } : {}),
			})
			layer.setSize(this.options.width, this.options.height)
			this.canvas.setLayer(layer)

			this.layerHandles.set(name, createLayerHandle(layer))
		}

		this.pointerInteraction = createPointerInteraction({
			target: this.container,
			hitTest: (x, y) => this.hitTest(x, y),
			getShapeCursor: hit =>
				this.canvas.getLayer(hit.layerName)?.shapes.get(hit.shapeId)?.cursor,
			onPointerDown: options.onShapePointerDown,
			onPointerMove: options.onShapePointerMove,
			onPointerUp: options.onShapePointerUp,
			onPointerEnter: options.onShapePointerEnter,
			onPointerLeave: options.onShapePointerLeave,
			onPointerCancel: options.onShapePointerCancel,
			onWheel: options.onShapeWheel,
			onClick: options.onShapeClick,
		})
		this.pointerInteraction.attach()
	}

	getLayer(name: string): LayerHandle | undefined {
		return this.layerHandles.get(name)
	}

	setLayerOpacity(name: string, opacity: number): void {
		if (this.destroyed) return

		const layer = this.canvas.getLayer(name)
		if (!layer) {
			throw new Error(`Layer "${name}" not found`)
		}

		layer.setOpacity(opacity)
	}

	setLayerZIndex(name: string, zIndex: number): void {
		if (this.destroyed) return

		const layer = this.canvas.getLayer(name)
		if (!layer) {
			throw new Error(`Layer "${name}" not found`)
		}

		layer.setZIndex(zIndex)
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

	hitTest(x: number, y: number) {
		if (this.destroyed) return undefined
		return this.canvas.hitTest(x, y)
	}

	setInteractionHandlers(handlers: Partial<SceneInteractionHandlers>): void {
		if (this.destroyed) return
		this.pointerInteraction.setHandlers({
			onPointerDown: handlers.onShapePointerDown,
			onPointerMove: handlers.onShapePointerMove,
			onPointerUp: handlers.onShapePointerUp,
			onPointerEnter: handlers.onShapePointerEnter,
			onPointerLeave: handlers.onShapePointerLeave,
			onPointerCancel: handlers.onShapePointerCancel,
			onWheel: handlers.onShapeWheel,
			onClick: handlers.onShapeClick,
		})
	}

	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true

		this.pointerInteraction.destroy()
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
