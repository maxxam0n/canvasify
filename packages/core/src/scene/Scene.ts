import { Canvas } from '../core/Canvas'
import { Layer } from '../core/Layer'
import { createPointerInteraction } from '../interaction/pointer-interaction'
import type {
	PointerInteraction,
	PointerInteractionHandlers,
} from '../interaction/pointer-interaction.types'
import type { CanvasHitTestResult } from '../model/hit-test.types'
import { createLayerHandle, disposeLayerHandle } from './LayerHandle'
import type { LayerHandle, SceneInteractionHandlers, SceneOptions } from './scene.types'

const DEFAULT_LAYERS = ['default']

const assertSceneSize = (width: number, height: number): void => {
	if (!Number.isFinite(width) || !Number.isFinite(height)) {
		throw new Error('Scene requires finite width and height in options')
	}
	if (width < 0 || height < 0) {
		throw new Error('Scene width and height must be non-negative')
	}
}

export class Scene {
	private readonly container: HTMLElement
	private readonly options: SceneOptions & { layers: string[] }
	private readonly canvas: Canvas
	private readonly layerHandles = new Map<string, LayerHandle>()
	private readonly pointerInteraction: PointerInteraction
	private destroyed = false

	constructor(container: HTMLElement, options?: SceneOptions) {
		if (typeof options?.width !== 'number' || typeof options?.height !== 'number') {
			throw new Error('Scene requires finite width and height in options')
		}
		assertSceneSize(options.width, options.height)

		const layerNames = [...(options.layers ?? DEFAULT_LAYERS)]
		if (new Set(layerNames).size !== layerNames.length) {
			throw new Error('Scene layer names must be unique')
		}

		this.container = container
		this.options = {
			width: options.width,
			height: options.height,
			background: options.background ?? 'transparent',
			layers: layerNames,
			workerRenderer: options.workerRenderer,
			workerLayers: options.workerLayers ? [...options.workerLayers] : undefined,
		}

		this.canvas = new Canvas()
		this.canvas.setDefaultBackground(this.options.background)

		const previousStyle = {
			position: this.container.style.position,
			width: this.container.style.width,
			height: this.container.style.height,
			backgroundColor: this.container.style.backgroundColor,
		}
		const createdLayers: Array<{
			name: string
			canvas: HTMLCanvasElement
			layer: Layer
			handle?: LayerHandle
		}> = []
		let pointerInteraction: PointerInteraction | undefined

		try {
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

				const useWorker =
					options.workerRenderer && (!options.workerLayers || options.workerLayers.includes(name))

				const layer = new Layer({
					name,
					canvas: canvasEl,
					width: this.options.width,
					height: this.options.height,
					onDirty: () => this.canvas.requestRender(),
					zIndex: i,
					...(useWorker ? { workerRenderer: options.workerRenderer } : {}),
				})
				const createdLayer: {
					name: string
					canvas: HTMLCanvasElement
					layer: Layer
					handle?: LayerHandle
				} = { name, canvas: canvasEl, layer }
				createdLayers.push(createdLayer)
				this.canvas.setLayer(layer)

				const handle = createLayerHandle(layer)
				createdLayer.handle = handle
				this.layerHandles.set(name, handle)
				this.container.appendChild(canvasEl)
			}

			pointerInteraction = createPointerInteraction({
				target: this.container,
				hitTest: (x, y) => this.hitTest(x, y),
				getShapeCursor: hit => this.canvas.getLayer(hit.layerName)?.shapes.get(hit.shapeId)?.cursor,
				onPointerDown: options.onShapePointerDown,
				onPointerMove: options.onShapePointerMove,
				onPointerUp: options.onShapePointerUp,
				onPointerEnter: options.onShapePointerEnter,
				onPointerLeave: options.onShapePointerLeave,
				onPointerCancel: options.onShapePointerCancel,
				onWheel: options.onShapeWheel,
				onClick: options.onShapeClick,
			})
			pointerInteraction.attach()
			this.pointerInteraction = pointerInteraction
		} catch (error: unknown) {
			pointerInteraction?.destroy()
			this.canvas.cancelRender()

			for (const createdLayer of createdLayers.reverse()) {
				if (createdLayer.handle) {
					disposeLayerHandle(createdLayer.handle)
				}
				this.layerHandles.delete(createdLayer.name)
				this.canvas.deleteLayer(createdLayer.name)
				createdLayer.layer.dispose()
				createdLayer.canvas.remove()
			}

			Object.assign(this.container.style, previousStyle)
			throw error
		}
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
		assertSceneSize(width, height)

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

	hitTest(x: number, y: number): CanvasHitTestResult | undefined {
		if (this.destroyed) return undefined
		return this.canvas.hitTest(x, y)
	}

	setInteractionHandlers(handlers: Partial<SceneInteractionHandlers>): void {
		if (this.destroyed) return
		const pointerHandlers: Partial<PointerInteractionHandlers> = {}
		if ('onShapePointerDown' in handlers) {
			pointerHandlers.onPointerDown = handlers.onShapePointerDown
		}
		if ('onShapePointerMove' in handlers) {
			pointerHandlers.onPointerMove = handlers.onShapePointerMove
		}
		if ('onShapePointerUp' in handlers) {
			pointerHandlers.onPointerUp = handlers.onShapePointerUp
		}
		if ('onShapePointerEnter' in handlers) {
			pointerHandlers.onPointerEnter = handlers.onShapePointerEnter
		}
		if ('onShapePointerLeave' in handlers) {
			pointerHandlers.onPointerLeave = handlers.onShapePointerLeave
		}
		if ('onShapePointerCancel' in handlers) {
			pointerHandlers.onPointerCancel = handlers.onShapePointerCancel
		}
		if ('onShapeWheel' in handlers) {
			pointerHandlers.onWheel = handlers.onShapeWheel
		}
		if ('onShapeClick' in handlers) {
			pointerHandlers.onClick = handlers.onShapeClick
		}
		this.pointerInteraction.setHandlers(pointerHandlers)
	}

	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true

		this.pointerInteraction.destroy()
		this.canvas.cancelRender()

		const layers = this.options.layers ?? DEFAULT_LAYERS
		for (const name of layers) {
			const handle = this.layerHandles.get(name)
			if (handle) {
				disposeLayerHandle(handle)
			}
			const layer = this.canvas.getLayer(name)
			if (layer) {
				layer.destroy()
				layer.canvas.remove()
				this.canvas.deleteLayer(name)
			}
		}

		this.layerHandles.clear()
	}
}
