import { renderShapes } from '../lib/render'
import type { LayerExportOptions } from '../model/export.types'
import type { RenderLayer } from '../model/layer.types'
import type { ShapeDrawingContext } from '../model/shape.types'

/**
 * Parameters for creating a new layer.
 */
export type LayerParams = {
	/** Unique name identifier for the layer. */
	name: string
	/** The HTML canvas element to render this layer on. */
	canvas: HTMLCanvasElement
	/** Optional width of the layer in logical pixels. */
	width?: number
	/** Optional height of the layer in logical pixels. */
	height?: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Optional custom renderer function for the layer. */
	renderer?: RenderLayer
	/** Optional callback function invoked when the layer becomes dirty (needs re-rendering). */
	onDirty?: () => void
}

export class Layer {
	public readonly canvas: HTMLCanvasElement
	public readonly ctx: CanvasRenderingContext2D
	public readonly name: string
	public readonly opacity: number
	public shapes: Map<string, ShapeDrawingContext> = new Map()
	private dirty: boolean = false
	private renderer?: RenderLayer
	private onDirty?: () => void

	constructor({ name, canvas, opacity = 1, renderer, onDirty }: LayerParams) {
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('failed to register layer: canvas context not found')
		}

		this.ctx = ctx
		this.canvas = canvas
		this.name = name
		this.opacity = opacity
		this.renderer = renderer
		this.onDirty = onDirty
	}

	public makeDirty() {
		this.dirty = true
		this.onDirty?.()
	}

	public setSize(width: number, height: number) {
		const dpr = window.devicePixelRatio || 1
		const logicalWidth = width
		const logicalHeight = height

		this.canvas.width = logicalWidth * dpr
		this.canvas.height = logicalHeight * dpr
		this.canvas.style.width = `${logicalWidth}px`
		this.canvas.style.height = `${logicalHeight}px`

		this.ctx.setTransform(1, 0, 0, 1, 0, 0)
		this.ctx.scale(dpr, dpr)
		this.makeDirty()

		return this
	}

	public render() {
		const { opacity, shapes, ctx } = this

		if (!this.dirty) return this

		if (this.renderer) {
			this.renderer(ctx, { opacity, shapes }, renderShapes)
		} else {
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			renderShapes(ctx, Array.from(shapes.values()))
		}
		this.dirty = false

		return this
	}

	public setShape(shape: ShapeDrawingContext) {
		this.shapes.set(shape.id, shape)
		this.makeDirty()

		return this
	}

	public removeShape(shape: ShapeDrawingContext) {
		this.shapes.delete(shape.id)
		this.makeDirty()

		return this
	}

	private createExportCanvas(options?: LayerExportOptions) {
		const applyOpacity = options?.applyOpacity ?? true
		const background = options?.background
		const maxSize = options?.maxSize
		const smoothing = options?.imageSmoothingEnabled

		const sourceCanvas = this.canvas
		const sourceWidth = sourceCanvas.width
		const sourceHeight = sourceCanvas.height

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

		const needsTransform =
			!!background ||
			(applyOpacity && this.opacity !== 1) ||
			targetWidth !== sourceWidth ||
			targetHeight !== sourceHeight

		if (!needsTransform) return sourceCanvas

		const exportCanvas = document.createElement('canvas')
		exportCanvas.width = targetWidth
		exportCanvas.height = targetHeight

		const exportCtx = exportCanvas.getContext('2d')
		if (!exportCtx) {
			throw new Error('failed to export layer: canvas context not found')
		}

		if (typeof smoothing === 'boolean') {
			exportCtx.imageSmoothingEnabled = smoothing
		}

		if (background) {
			exportCtx.save()
			exportCtx.globalAlpha = 1
			exportCtx.fillStyle = background
			exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
			exportCtx.restore()
		}

		exportCtx.save()
		exportCtx.globalAlpha = applyOpacity ? this.opacity : 1
		exportCtx.drawImage(
			sourceCanvas,
			0,
			0,
			sourceWidth,
			sourceHeight,
			0,
			0,
			targetWidth,
			targetHeight,
		)
		exportCtx.restore()

		return exportCanvas
	}

	public toDataURL(options?: LayerExportOptions) {
		this.render()
		const exportCanvas = this.createExportCanvas(options)
		const type = options?.type ?? 'image/png'
		return exportCanvas.toDataURL(type, options?.quality)
	}

	public async toBlob(options?: LayerExportOptions): Promise<Blob> {
		this.render()
		const exportCanvas = this.createExportCanvas(options)
		const type = options?.type ?? 'image/png'
		const quality = options?.quality

		return await new Promise<Blob>((resolve, reject) => {
			exportCanvas.toBlob(
				blob => {
					if (!blob) {
						reject(new Error('failed to export layer: toBlob returned null'))
						return
					}
					resolve(blob)
				},
				type,
				quality,
			)
		})
	}
}
