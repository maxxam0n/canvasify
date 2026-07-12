import type { CanvasExportOptions, LayerExportOptions } from '../model/export.types'
import type { CanvasHitTestResult } from '../model/hit-test.types'

import type { Layer } from './Layer'

export class Canvas {
	private layers: Map<string, Layer> = new Map()
	private animationFrameId: number | null = null
	private isRenderScheduled = false
	/** Фон по умолчанию для export, если в options не передан background. */
	private defaultBackground?: string

	constructor() {}

	/**
	 * Задаёт фон по умолчанию для toDataURL/toBlob.
	 * Значение `transparent` сбрасывает default (экспорт без заливки).
	 */
	public setDefaultBackground(background: string | undefined) {
		this.defaultBackground =
			background && background !== 'transparent' ? background : undefined
		return this
	}

	public render() {
		this.isRenderScheduled = false
		this.animationFrameId = null
		this.layers.forEach(layer => layer.render())

		return this
	}

	public setLayer(layer: Layer) {
		this.layers.set(layer.name, layer)

		return this
	}

	public getLayer(name: string) {
		return this.layers.get(name)
	}

	public deleteLayer(name: string) {
		this.layers.delete(name)

		return this
	}

	public getLayers() {
		return Array.from(this.layers.values())
	}

	/**
	 * Слои снизу вверх: zIndex asc, при равенстве — порядок регистрации.
	 * Согласовано с CSS stacking (позже зарегистрированный слой выше при одинаковом zIndex).
	 */
	private getLayersBottomToTop(): Layer[] {
		return this.getLayers()
			.map((layer, index) => ({ layer, index }))
			.sort((a, b) => {
				const byZ = a.layer.zIndex - b.layer.zIndex
				if (byZ !== 0) return byZ
				return a.index - b.index
			})
			.map(({ layer }) => layer)
	}

	/**
	 * Hit-test по слоям сверху вниз (zIndex desc; при равенстве — последние зарегистрированные выше).
	 * Учитывает layer.opacity === 0 как неинтерактивный.
	 */
	public hitTest(x: number, y: number): CanvasHitTestResult | undefined {
		const layers = this.getLayersBottomToTop().reverse()

		for (const layer of layers) {
			if (layer.opacity <= 0) continue
			const hit = layer.hitTest(x, y)
			if (hit) {
				return { ...hit, layerName: layer.name }
			}
		}

		return undefined
	}

	public requestRender() {
		if (this.isRenderScheduled) return this

		this.isRenderScheduled = true
		this.animationFrameId = requestAnimationFrame(() => this.render())

		return this
	}

	public cancelRender() {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId)
		}
		this.animationFrameId = null
		this.isRenderScheduled = false

		return this
	}

	private createCompositeCanvas(options?: CanvasExportOptions) {
		this.render()

		const layers = this.getLayersBottomToTop()
		if (layers.length === 0) {
			throw new Error('failed to export canvas: no layers registered')
		}

		const sourceWidth = Math.max(...layers.map(l => l.canvas.width))
		const sourceHeight = Math.max(...layers.map(l => l.canvas.height))

		const maxSize = options?.maxSize
		const smoothing = options?.imageSmoothingEnabled

		let targetWidth = sourceWidth
		let targetHeight = sourceHeight

		if (maxSize && maxSize > 0) {
			const maxSide = Math.max(sourceWidth, sourceHeight)
			if (maxSide > maxSize) {
				const scale = maxSize / maxSide
				targetWidth = Math.max(1, Math.round(sourceWidth * scale))
				targetHeight = Math.max(1, Math.round(sourceHeight * scale))
			}
		}

		const exportCanvas = document.createElement('canvas')
		exportCanvas.width = targetWidth
		exportCanvas.height = targetHeight

		const ctx = exportCanvas.getContext('2d')
		if (!ctx) {
			throw new Error('failed to export canvas: canvas context not found')
		}

		if (typeof smoothing === 'boolean') {
			ctx.imageSmoothingEnabled = smoothing
		}

		const background = options?.background ?? this.defaultBackground
		if (background) {
			ctx.save()
			ctx.globalAlpha = 1
			ctx.fillStyle = background
			ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
			ctx.restore()
		}

		for (const layer of layers) {
			ctx.save()
			ctx.globalAlpha = layer.opacity
			ctx.drawImage(layer.canvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
			ctx.restore()
		}

		return exportCanvas
	}

	public toDataURL(options?: CanvasExportOptions) {
		const exportCanvas = this.createCompositeCanvas(options)
		const type = options?.type ?? 'image/png'
		return exportCanvas.toDataURL(type, options?.quality)
	}

	public async toBlob(options?: CanvasExportOptions): Promise<Blob> {
		const exportCanvas = this.createCompositeCanvas(options)
		const type = options?.type ?? 'image/png'
		const quality = options?.quality

		return await new Promise<Blob>((resolve, reject) => {
			exportCanvas.toBlob(
				blob => {
					if (!blob) {
						reject(new Error('failed to export canvas: toBlob returned null'))
						return
					}
					resolve(blob)
				},
				type,
				quality,
			)
		})
	}

	public layerToDataURL(name: string, options?: LayerExportOptions) {
		const layer = this.getLayer(name)
		if (!layer) {
			throw new Error(`failed to export layer: layer "${name}" not found`)
		}
		return layer.toDataURL(options)
	}

	public layerToBlob(name: string, options?: LayerExportOptions) {
		const layer = this.getLayer(name)
		if (!layer) {
			return Promise.reject(new Error(`failed to export layer: layer "${name}" not found`))
		}
		return layer.toBlob(options)
	}
}
