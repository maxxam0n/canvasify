import { renderShapes } from '../lib/render'
import {
	inflateRect,
	transformRectToWorld,
	unionRectList,
	unionRects,
} from '../lib/rect.utils'
import { sortShapesByZIndex } from '../lib/shape-context.utils'
import { invertPointThroughTransforms } from '../lib/transform'
import type { LayerExportOptions } from '../model/export.types'
import type { HitTestResult } from '../model/hit-test.types'
import type { RenderLayer } from '../model/layer.types'
import type { Rect } from '../model/rect.types'
import type { ShapeDrawingContext } from '../model/shape.types'

/** Padding вокруг dirty region (антиалиасинг / субпиксель). */
const DIRTY_PADDING = 1

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
	/** CSS / hit-test / export stacking order. Higher values are on top. Defaults to 0. */
	zIndex?: number
	/** Optional custom renderer function for the layer. */
	renderer?: RenderLayer
	/** Optional callback function invoked when the layer becomes dirty (needs re-rendering). */
	onDirty?: () => void
}

export class Layer {
	public readonly canvas: HTMLCanvasElement
	public readonly ctx: CanvasRenderingContext2D
	public readonly name: string
	private _opacity: number
	private _zIndex: number
	public shapes: Map<string, ShapeDrawingContext> = new Map()
	/** true = нужна полная перерисовка слоя. */
	private dirtyFull = false
	/** Накопленные dirty regions (логически пиксели). Игнорируются при dirtyFull. */
	private dirtyRects: Rect[] = []
	/** Последние известные world-bounds фигур — для корректного invalidate при смене размера. */
	private shapeBoundsCache = new Map<string, Rect>()
	private logicalWidth = 0
	private logicalHeight = 0
	private renderer?: RenderLayer
	private onDirty?: () => void
	/** Кеш фигур, отсортированных по zIndex (asc). Сбрасывается при изменении shapes. */
	private sortedShapesCache: ShapeDrawingContext[] | null = null

	constructor({ name, canvas, opacity = 1, zIndex = 0, renderer, onDirty }: LayerParams) {
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('failed to register layer: canvas context not found')
		}

		this.ctx = ctx
		this.canvas = canvas
		this.name = name
		this.renderer = renderer
		this.onDirty = onDirty
		this._opacity = 1
		this._zIndex = 0
		this.setOpacity(opacity)
		this.setZIndex(zIndex)
	}

	/** Текущая прозрачность слоя (экран через CSS opacity на canvas, export через compositing). */
	public get opacity(): number {
		return this._opacity
	}

	/** Текущий zIndex слоя (CSS, hit-test и порядок compositing при export). */
	public get zIndex(): number {
		return this._zIndex
	}

	/**
	 * Обновляет прозрачность слоя без пересоздания.
	 * На экране применяется через `canvas.style.opacity`, в export — при compositing.
	 */
	public setOpacity(opacity: number) {
		this._opacity = opacity
		this.canvas.style.opacity = String(opacity)
		return this
	}

	/**
	 * Обновляет zIndex слоя без пересоздания.
	 * На экране — `canvas.style.zIndex`, в hit-test/export — порядок стека.
	 */
	public setZIndex(zIndex: number) {
		this._zIndex = zIndex
		this.canvas.style.zIndex = String(zIndex)
		return this
	}

	/** Заменяет кастомный renderer и помечает слой dirty. */
	public setRenderer(renderer?: RenderLayer) {
		this.renderer = renderer
		this.makeDirty()
		return this
	}

	/**
	 * Помечает слой как нуждающийся в перерисовке.
	 * Без region — полная перерисовка; с region — dirty region (если ранее не было full).
	 */
	public makeDirty(region?: Rect) {
		if (!region) {
			this.dirtyFull = true
			this.dirtyRects = []
		} else if (!this.dirtyFull) {
			this.dirtyRects.push(inflateRect(region, DIRTY_PADDING))
		}
		this.onDirty?.()
	}

	/**
	 * Инвалидирует фигуру по id (например после async load / fonts.ready).
	 * Объединяет cached bounds с актуальными; без bounds — full dirty.
	 */
	public invalidateShape(id: string) {
		const shape = this.shapes.get(id)
		const cached = this.shapeBoundsCache.get(id)
		const next = shape ? this.resolveWorldBounds(shape) : undefined

		if (cached && next) {
			this.makeDirty(unionRects(cached, next))
		} else if (cached) {
			this.makeDirty(cached)
		} else if (next) {
			this.makeDirty(next)
		} else {
			this.makeDirty()
		}

		if (next) this.shapeBoundsCache.set(id, next)
		else this.shapeBoundsCache.delete(id)

		return this
	}

	public setSize(width: number, height: number) {
		const dpr = window.devicePixelRatio || 1
		const logicalWidth = width
		const logicalHeight = height

		this.logicalWidth = logicalWidth
		this.logicalHeight = logicalHeight

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
		const { opacity, ctx } = this

		if (!this.isDirty()) return this

		const shapes = this.getSortedShapes()
		const useRegions = !this.dirtyFull && this.dirtyRects.length > 0 && !this.renderer
		const region = useRegions ? unionRectList(this.dirtyRects) : undefined

		if (this.renderer) {
			this.renderer(ctx, { opacity, shapes: this.shapes }, renderShapes)
		} else if (region) {
			ctx.save()
			ctx.beginPath()
			ctx.rect(region.x, region.y, region.width, region.height)
			ctx.clip()
			ctx.clearRect(region.x, region.y, region.width, region.height)
			renderShapes(ctx, shapes)
			ctx.restore()
		} else {
			const clearWidth = this.logicalWidth || this.canvas.width
			const clearHeight = this.logicalHeight || this.canvas.height
			ctx.clearRect(0, 0, clearWidth, clearHeight)
			renderShapes(ctx, shapes)
		}

		this.refreshShapeBoundsCache()
		this.dirtyFull = false
		this.dirtyRects = []

		return this
	}

	public setShape(shape: ShapeDrawingContext) {
		const prev = this.shapes.get(shape.id)
		const prevBounds = prev
			? (this.shapeBoundsCache.get(shape.id) ?? this.resolveWorldBounds(prev))
			: undefined
		const nextBounds = this.resolveWorldBounds(shape)

		this.shapes.set(shape.id, shape)
		this.sortedShapesCache = null

		if (prevBounds && nextBounds) {
			this.makeDirty(unionRects(prevBounds, nextBounds))
		} else if (prevBounds) {
			this.makeDirty(prevBounds)
		} else if (nextBounds) {
			this.makeDirty(nextBounds)
		} else {
			this.makeDirty()
		}

		if (nextBounds) this.shapeBoundsCache.set(shape.id, nextBounds)
		else this.shapeBoundsCache.delete(shape.id)

		return this
	}

	public removeShape(shape: ShapeDrawingContext) {
		const bounds =
			this.shapeBoundsCache.get(shape.id) ?? this.resolveWorldBounds(shape)

		this.shapes.delete(shape.id)
		this.sortedShapesCache = null
		this.shapeBoundsCache.delete(shape.id)

		if (bounds) this.makeDirty(bounds)
		else this.makeDirty()

		return this
	}

	/**
	 * Hit-test в логических координатах слоя.
	 * opacity фигуры не влияет на попадание: `opacity === 0` остаётся кликабельным намеренно
	 * (невидимый hit-area). CSS opacity слоя учитывается в `Canvas.hitTest`.
	 * Возвращает верхнюю фигуру или undefined.
	 */
	public hitTest(x: number, y: number): HitTestResult | undefined {
		const shapes = sortShapesByZIndex(Array.from(this.shapes.values()), 'desc')

		for (const shape of shapes) {
			if (!shape.contains) continue

			const transforms = shape.transforms ?? []
			const local = invertPointThroughTransforms({ x, y }, transforms)
			if (!local) continue

			if (shape.contains(local.x, local.y)) {
				return {
					shapeId: shape.id,
					meta: shape.meta,
					zIndex: shape.shapeParams.zIndex,
				}
			}
		}

		return undefined
	}

	private isDirty(): boolean {
		return this.dirtyFull || this.dirtyRects.length > 0
	}

	private resolveWorldBounds(shape: ShapeDrawingContext): Rect | undefined {
		const local = shape.getLocalBounds?.()
		if (!local) return undefined
		return transformRectToWorld(local, shape.transforms ?? [])
	}

	private refreshShapeBoundsCache() {
		this.shapeBoundsCache.clear()
		for (const shape of this.shapes.values()) {
			const bounds = this.resolveWorldBounds(shape)
			if (bounds) this.shapeBoundsCache.set(shape.id, bounds)
		}
	}

	private getSortedShapes(): ShapeDrawingContext[] {
		if (!this.sortedShapesCache) {
			this.sortedShapesCache = sortShapesByZIndex(Array.from(this.shapes.values()), 'asc')
		}
		return this.sortedShapesCache
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
