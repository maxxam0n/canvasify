import { renderShapes } from '../lib/render'
import { withRenderViewport } from '../lib/render-context'
import {
	inflateWorldBoundsForEffects,
	requiresFullDirtyForComposite,
} from '../lib/draw-effects.utils'
import { type CacheCanvas, createCacheSurface } from '../lib/offscreen-canvas.utils'
import {
	inflateRect,
	rectsIntersect,
	transformRectToWorld,
	unionRectList,
	unionRects,
} from '../lib/rect.utils'
import { sortShapesByZIndex } from '../lib/shape-context.utils'
import {
	type SpatialIndexOptions,
	UniformGridSpatialIndex,
	resolveSpatialIndexConfig,
} from '../lib/spatial-index'
import { invertPointThroughTransforms } from '../lib/transform'
import {
	createViewportShiftPlan,
	resolvePhysicalViewportShift,
	type ViewportShiftPlan,
} from '../lib/viewport-shift'
import type { LayerExportOptions } from '../model/export.types'
import type { HitTestResult } from '../model/hit-test.types'
import type { RenderLayer } from '../model/layer.types'
import type { Rect } from '../model/rect.types'
import type { BaseShape, ShapeDrawingContext } from '../model/shape.types'
import { shapesMapToWorkerSnapshots } from '../worker/snapshot.mapper'
import { createRealWorkerPort, type WorkerRenderPort } from '../worker/worker-port'
import { WORKER_PROTOCOL_VERSION, type WorkerToMainMessage } from '../worker/worker.types'

/** Padding вокруг dirty region (антиалиасинг / субпиксель). */
const DIRTY_PADDING = 1
const MAX_PARTIAL_REDRAW_REGIONS = 16

/**
 * Opt-in experimental paint в Web Worker (OffscreenCanvas).
 * Hit-test остаётся на main thread.
 */
export type LayerWorkerRendererOptions = {
	/** Фабрика Worker, адаптированная к загрузчику текущего сборщика. Для Vite см. README. */
	createWorker: () => Worker
	/** Test inject: in-process port вместо реального Worker. */
	port?: WorkerRenderPort
}

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
	/**
	 * Optional renderer used for scene exports.
	 * Defaults to `renderer`, then to the standard shape renderer.
	 */
	exportRenderer?: RenderLayer
	/** Optional callback function invoked when the layer becomes dirty (needs re-rendering). */
	onDirty?: () => void
	/**
	 * Статический режим: при валидном кеше render() только блитит снимок,
	 * не перерисовывая фигуры. Перед включением вызовите `cache()`.
	 */
	static?: boolean
	/**
	 * Пространственный индекс для hit-test.
	 * По умолчанию включается при числе фигур >= threshold (64).
	 */
	spatialIndex?: SpatialIndexOptions
	/**
	 * Experimental: paint в worker через OffscreenCanvas.
	 * Несовместимо с кастомным `renderer`. См. README — Experimental Worker.
	 */
	workerRenderer?: LayerWorkerRendererOptions
}

export type LayerSurfaceOptions = {
	/** Full logical width of the layer in world coordinates. */
	width?: number
	/** Full logical height of the layer in world coordinates. */
	height?: number
	/** Visible surface in world coordinates. Null renders the full layer. */
	viewport?: Rect | null
	/** Requested bitmap pixel ratio. Defaults to devicePixelRatio. */
	pixelRatio?: number
	/**
	 * Maximum number of physical pixels in the backing bitmap.
	 * A non-empty viewport still allocates at least one pixel per dimension.
	 */
	maxPixelCount?: number
}

export type LayerRenderTarget = {
	width: number
	height: number
	applyOpacity?: boolean
	/** Shared scene width used when composing layers with different sizes. */
	sceneWidth?: number
	/** Shared scene height used when composing layers with different sizes. */
	sceneHeight?: number
}

export type SetShapeOptions = {
	/**
	 * Экземпляр BaseShape для worker snapshot (instanceof).
	 * Обязателен при включённом `workerRenderer`.
	 */
	source?: BaseShape
}

const assertWorkerPaintSupported = () => {
	if (typeof OffscreenCanvas === 'undefined') {
		throw new Error(
			'Layer workerRenderer requires OffscreenCanvas (not available in this environment)',
		)
	}
	if (
		typeof HTMLCanvasElement === 'undefined' ||
		typeof HTMLCanvasElement.prototype.transferControlToOffscreen !== 'function'
	) {
		throw new Error('Layer workerRenderer requires HTMLCanvasElement.transferControlToOffscreen()')
	}
}

const areRectsEqual = (left: Rect | null, right: Rect | null): boolean =>
	left?.x === right?.x &&
	left?.y === right?.y &&
	left?.width === right?.width &&
	left?.height === right?.height

const assertPositiveFinite = (value: number, name: string): void => {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`Layer ${name} must be a positive finite number`)
	}
}

const assertNonNegativeFinite = (value: number, name: string): void => {
	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`Layer ${name} must be a non-negative finite number`)
	}
}

export class Layer {
	public readonly canvas: HTMLCanvasElement
	/**
	 * 2D-контекст main-path. В worker-режиме отсутствует:
	 * `transferControlToOffscreen()` нельзя вызывать после `getContext`.
	 */
	public readonly ctx: CanvasRenderingContext2D | undefined
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
	private surfaceConfigured = false
	private surfaceViewport: Rect | null = null
	private requestedPixelRatio: number | undefined
	private maxPixelCount: number | undefined
	private effectivePixelRatio = 1
	private renderer?: RenderLayer
	private exportRenderer?: RenderLayer
	private onDirty?: () => void
	/** Кеш фигур, отсортированных по zIndex (asc). Сбрасывается при изменении shapes. */
	private sortedShapesCache: ShapeDrawingContext[] | null = null
	private interactiveShapesCache: ShapeDrawingContext[] | null = null
	/**
	 * Bitmap-кеш слоя (физические пиксели = canvas.width × height).
	 * Предпочитаем OffscreenCanvas — нет DOM-узла для кеша; иначе HTMLCanvasElement.
	 */
	private cacheCanvas: CacheCanvas | null = null
	/** true — снимок актуален, render() может блитить cacheCanvas. */
	private cached = false
	/**
	 * Статический режим: при cached render() игнорирует dirty для перерисовки фигур
	 * и только восстанавливает снимок. Сбрасывается через clearCache() / setStatic(false).
	 */
	private staticMode = false
	private spatialIndexConfig = resolveSpatialIndexConfig()
	private readonly spatialIndex: UniformGridSpatialIndex
	private spatialIndexDirty = true

	/** Worker paint port (opt-in). */
	private readonly workerPort: WorkerRenderPort | null = null
	private readonly ownsWorkerPort: boolean
	private unsubscribeWorker?: () => void
	private workerReady = false
	/** Ownership canvas уже передан worker'у через transferControlToOffscreen. */
	private workerTransferred = false
	private revision = 0
	/** BaseShape по id — для shapesMapToWorkerSnapshots. */
	private readonly shapeSources = new Map<string, BaseShape>()
	private disposed = false

	constructor({
		name,
		canvas,
		width,
		height,
		opacity = 1,
		zIndex = 0,
		renderer,
		exportRenderer,
		onDirty,
		static: staticMode = false,
		spatialIndex,
		workerRenderer,
	}: LayerParams) {
		if (workerRenderer && renderer) {
			throw new Error('Layer cannot use both custom renderer and workerRenderer')
		}
		if (workerRenderer && staticMode) {
			throw new Error('Layer cannot use static: true together with workerRenderer')
		}
		if (width !== undefined) {
			assertNonNegativeFinite(width, 'width')
		}
		if (height !== undefined) {
			assertNonNegativeFinite(height, 'height')
		}

		this.canvas = canvas
		this.name = name
		this.renderer = renderer
		this.exportRenderer = exportRenderer
		this.onDirty = onDirty
		this._opacity = 1
		this._zIndex = 0
		this.ownsWorkerPort = workerRenderer !== undefined && workerRenderer.port === undefined

		if (workerRenderer) {
			assertWorkerPaintSupported()
			// Worker-path: НЕ вызывать getContext — иначе transferControlToOffscreen() бросит.
			this.ctx = undefined
			this.workerPort =
				workerRenderer.port ?? createRealWorkerPort({ worker: workerRenderer.createWorker() })
			this.unsubscribeWorker = this.workerPort.subscribe(message => {
				this.handleWorkerMessage(message)
			})
		} else {
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				throw new Error('failed to register layer: canvas context not found')
			}
			this.ctx = ctx
		}

		this.setOpacity(opacity)
		this.setZIndex(zIndex)
		this.staticMode = staticMode
		this.spatialIndexConfig = resolveSpatialIndexConfig(spatialIndex)
		this.spatialIndex = new UniformGridSpatialIndex(this.spatialIndexConfig.cellSize)
		if (width !== undefined || height !== undefined) {
			try {
				this.setSurface({ width, height })
			} catch (error: unknown) {
				this.dispose()
				throw error
			}
		}
	}

	/** Освобождает подписки и worker-ресурсы, принадлежащие слою. */
	public dispose() {
		if (this.disposed) return this
		this.disposed = true

		this.unsubscribeWorker?.()
		this.unsubscribeWorker = undefined
		if (this.ownsWorkerPort) {
			this.workerPort?.terminate()
		}

		this.workerReady = false
		this.onDirty = undefined
		this.renderer = undefined
		this.exportRenderer = undefined
		this.shapes.clear()
		this.shapeSources.clear()
		this.shapeBoundsCache.clear()
		this.spatialIndex.clear()
		this.sortedShapesCache = null
		this.interactiveShapesCache = null
		this.invalidateCache()
		this.clearDirtyState()
		return this
	}

	/** Алиас для destroy-style lifecycle API. */
	public destroy() {
		return this.dispose()
	}

	/** Текущая прозрачность слоя (экран через CSS opacity на canvas, export через compositing). */
	public get opacity(): number {
		return this._opacity
	}

	/** Текущий zIndex слоя (CSS, hit-test и порядок compositing при export). */
	public get zIndex(): number {
		return this._zIndex
	}

	/** Full logical scene size in world coordinates. */
	public getSize(): { width: number; height: number } {
		return { width: this.logicalWidth, height: this.logicalHeight }
	}

	/** Visible backing surface in world coordinates. */
	public getViewport(): Rect {
		return this.resolveViewport()
	}

	/** Pixel ratio actually used after applying the pixel budget. */
	public getPixelRatio(): number {
		return this.effectivePixelRatio
	}

	/**
	 * Обновляет прозрачность слоя без пересоздания.
	 * На экране применяется через `canvas.style.opacity`, в export — при compositing.
	 */
	public setOpacity(opacity: number) {
		if (this.disposed) return this
		this._opacity = opacity
		this.canvas.style.opacity = String(opacity)
		return this
	}

	/**
	 * Обновляет zIndex слоя без пересоздания.
	 * На экране — `canvas.style.zIndex`, в hit-test/export — порядок стека.
	 */
	public setZIndex(zIndex: number) {
		if (this.disposed) return this
		this._zIndex = zIndex
		this.canvas.style.zIndex = String(zIndex)
		return this
	}

	/** Заменяет кастомный renderer и помечает слой dirty. */
	public setRenderer(renderer?: RenderLayer) {
		if (this.disposed) return this
		if (this.workerPort) {
			throw new Error('Layer.setRenderer() is not supported when workerRenderer is enabled')
		}
		this.renderer = renderer
		this.invalidateCache()
		this.makeDirty()
		return this
	}

	/** Replaces the renderer used by vector exports. */
	public setExportRenderer(renderer?: RenderLayer) {
		if (this.disposed) return this
		this.exportRenderer = renderer
		return this
	}

	/** Статический режим активен (см. `setStatic`). */
	public get static(): boolean {
		return this.staticMode
	}

	/**
	 * Включает/выключает статический режим.
	 * `true` — при валидном кеше render() только блитит снимок; перед включением вызовите `cache()`.
	 * `false` — сбрасывает кеш и возвращает обычную dirty-перерисовку.
	 */
	public setStatic(staticMode: boolean) {
		if (this.disposed) return this
		if (this.workerPort && staticMode) {
			throw new Error('Layer.setStatic(true) is not supported when workerRenderer is enabled')
		}
		this.staticMode = staticMode
		if (!staticMode) {
			this.invalidateCache()
		}
		return this
	}

	/**
	 * Снимает снимок текущего содержимого слоя в offscreen-canvas.
	 * При dirty сначала перерисовывает фигуры. С кастомным renderer — no-op.
	 */
	public cache() {
		if (this.disposed) return this
		if (this.workerPort) {
			throw new Error('Layer.cache() is not supported when workerRenderer is enabled')
		}
		if (this.renderer) return this

		if (this.isDirty()) {
			this.renderShapesContent()
			this.clearDirtyState()
		}

		this.captureCache()
		return this
	}

	/** Сбрасывает bitmap-кеш; следующий render() перерисует фигуры по dirty. */
	public clearCache() {
		if (this.disposed) return this
		this.invalidateCache()
		return this
	}

	/**
	 * Помечает слой как нуждающийся в перерисовке.
	 * Без region — полная перерисовка; с region — dirty region (если ранее не было full).
	 */
	public makeDirty(region?: Rect) {
		if (this.disposed) return
		if (!region) {
			this.dirtyFull = true
			this.dirtyRects = []
		} else if (!this.dirtyFull) {
			this.dirtyRects.push(inflateRect(region, DIRTY_PADDING))
		}
		// static + cached: dirty только для onDirty; снимок не инвалидируем
		if (!(this.staticMode && this.cached)) {
			this.invalidateCache()
		}
		this.onDirty?.()
	}

	/**
	 * Инвалидирует фигуру по id (например после async load / fonts.ready).
	 * Объединяет cached bounds с актуальными; без bounds — full dirty.
	 */
	public invalidateShape(id: string) {
		if (this.disposed) return this
		this.invalidateCache()
		this.interactiveShapesCache = null
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

		this.markSpatialIndexDirty()
		this.postWorkerShapesIfReady()
		return this
	}

	public setSize(width: number, height: number) {
		return this.setSurface({ width, height })
	}

	public setViewport(viewport?: Rect | null) {
		return this.setSurface({ viewport })
	}

	public setPixelRatio(pixelRatio?: number) {
		return this.setSurface({ pixelRatio })
	}

	public setMaxPixelCount(maxPixelCount?: number) {
		return this.setSurface({ maxPixelCount })
	}

	/**
	 * Atomically updates logical dimensions and bitmap constraints.
	 * The viewport only changes the backing surface; scene coordinates stay unchanged.
	 */
	public setSurface(options: LayerSurfaceOptions) {
		if (this.disposed) return this

		const nextLogicalWidth = typeof options.width === 'number' ? options.width : this.logicalWidth
		const nextLogicalHeight =
			typeof options.height === 'number' ? options.height : this.logicalHeight
		const nextSurfaceViewport =
			'viewport' in options
				? options.viewport
					? { ...options.viewport }
					: null
				: this.surfaceViewport
		const nextRequestedPixelRatio =
			'pixelRatio' in options ? options.pixelRatio : this.requestedPixelRatio
		const nextMaxPixelCount =
			'maxPixelCount' in options ? options.maxPixelCount : this.maxPixelCount

		assertNonNegativeFinite(nextLogicalWidth, 'width')
		assertNonNegativeFinite(nextLogicalHeight, 'height')
		if (this.workerPort && nextSurfaceViewport) {
			throw new Error('Layer viewport is not supported with workerRenderer')
		}
		if (nextSurfaceViewport) {
			assertPositiveFinite(nextSurfaceViewport.width, 'viewport.width')
			assertPositiveFinite(nextSurfaceViewport.height, 'viewport.height')
			if (!Number.isFinite(nextSurfaceViewport.x) || !Number.isFinite(nextSurfaceViewport.y)) {
				throw new Error('Layer viewport coordinates must be finite numbers')
			}
		}
		if (nextRequestedPixelRatio !== undefined) {
			assertPositiveFinite(nextRequestedPixelRatio, 'pixelRatio')
		}
		if (nextMaxPixelCount !== undefined) {
			assertPositiveFinite(nextMaxPixelCount, 'maxPixelCount')
		}
		this.surfaceConfigured = true

		const logicalSizeChanged =
			this.logicalWidth !== nextLogicalWidth || this.logicalHeight !== nextLogicalHeight
		const viewportChanged = !areRectsEqual(this.surfaceViewport, nextSurfaceViewport)
		const pixelConfigChanged =
			this.requestedPixelRatio !== nextRequestedPixelRatio ||
			this.maxPixelCount !== nextMaxPixelCount
		if (!logicalSizeChanged && !viewportChanged && !pixelConfigChanged) {
			const viewport = this.resolveViewport(
				nextLogicalWidth,
				nextLogicalHeight,
				nextSurfaceViewport,
			)
			if (viewport.width <= 0 || viewport.height <= 0) {
				this.resizeSurface()
			}
			return this
		}

		const hadSurface = this.logicalWidth > 0 && this.logicalHeight > 0
		const previousViewport = hadSurface ? this.resolveViewport() : null
		const nextViewport = this.resolveViewport(
			nextLogicalWidth,
			nextLogicalHeight,
			nextSurfaceViewport,
		)
		const nextPixelRatio = this.resolvePixelRatio(
			nextViewport,
			nextRequestedPixelRatio,
			nextMaxPixelCount,
		)
		const canShiftViewport =
			!this.workerPort &&
			previousViewport !== null &&
			viewportChanged &&
			!logicalSizeChanged &&
			!pixelConfigChanged &&
			!this.dirtyFull &&
			previousViewport.width === nextViewport.width &&
			previousViewport.height === nextViewport.height &&
			this.canvas.width === Math.max(1, Math.round(nextViewport.width * nextPixelRatio)) &&
			this.canvas.height === Math.max(1, Math.round(nextViewport.height * nextPixelRatio))

		this.logicalWidth = nextLogicalWidth
		this.logicalHeight = nextLogicalHeight
		this.surfaceViewport = nextSurfaceViewport
		this.requestedPixelRatio = nextRequestedPixelRatio
		this.maxPixelCount = nextMaxPixelCount

		if (nextViewport.width <= 0 || nextViewport.height <= 0) {
			this.resizeSurface()
			this.invalidateCache()
			this.clearDirtyState()
			this.onDirty?.()
			return this
		}

		if (canShiftViewport) {
			this.effectivePixelRatio = nextPixelRatio
			this.updateSurfaceStyle(nextViewport)
			this.invalidateCache()

			const shiftPlan = createViewportShiftPlan(previousViewport, nextViewport)
			if (shiftPlan && this.shiftSurfaceBitmap(shiftPlan, nextViewport)) {
				shiftPlan.exposedRegions.forEach(region => this.makeDirty(region))
				return this
			}

			this.applySurfaceTransform(this.requireMainCtx())
			this.makeDirty()
			return this
		}

		this.resizeSurface()
		this.invalidateCache()
		this.makeDirty()
		return this
	}

	private resolveViewport(
		logicalWidth = this.logicalWidth,
		logicalHeight = this.logicalHeight,
		surfaceViewport: Rect | null = this.surfaceViewport,
	): Rect {
		if (!surfaceViewport) {
			return {
				x: 0,
				y: 0,
				width: logicalWidth,
				height: logicalHeight,
			}
		}

		const left = Math.max(0, Math.min(logicalWidth, surfaceViewport.x))
		const top = Math.max(0, Math.min(logicalHeight, surfaceViewport.y))
		const right = Math.max(left, Math.min(logicalWidth, surfaceViewport.x + surfaceViewport.width))
		const bottom = Math.max(
			top,
			Math.min(logicalHeight, surfaceViewport.y + surfaceViewport.height),
		)

		return {
			x: left,
			y: top,
			width: right - left,
			height: bottom - top,
		}
	}

	private resolvePixelRatio(
		viewport: Rect,
		requestedPixelRatio = this.requestedPixelRatio,
		maxPixelCount = this.maxPixelCount,
	): number {
		const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
		const requested = requestedPixelRatio ?? devicePixelRatio
		const logicalPixels = viewport.width * viewport.height

		if (!maxPixelCount || logicalPixels <= 0) return requested

		const pixelBudget = Math.max(1, Math.floor(maxPixelCount))
		const cappedRatio = Math.min(requested, Math.sqrt(pixelBudget / logicalPixels))
		const getBitmapPixelCount = (ratio: number): number => {
			const width = viewport.width > 0 ? Math.max(1, Math.round(viewport.width * ratio)) : 0
			const height = viewport.height > 0 ? Math.max(1, Math.round(viewport.height * ratio)) : 0
			return width * height
		}

		if (getBitmapPixelCount(cappedRatio) <= pixelBudget) {
			return cappedRatio
		}

		let lowerRatio = 0
		let upperRatio = cappedRatio
		for (let iteration = 0; iteration < 48; iteration++) {
			const candidateRatio = (lowerRatio + upperRatio) / 2
			if (getBitmapPixelCount(candidateRatio) <= pixelBudget) {
				lowerRatio = candidateRatio
			} else {
				upperRatio = candidateRatio
			}
		}

		return lowerRatio
	}

	private applySurfaceTransform(ctx: CanvasRenderingContext2D): void {
		const viewport = this.resolveViewport()
		const scaleX = viewport.width > 0 ? this.canvas.width / viewport.width : 1
		const scaleY = viewport.height > 0 ? this.canvas.height / viewport.height : 1
		const translateX = viewport.x === 0 ? 0 : -viewport.x * scaleX
		const translateY = viewport.y === 0 ? 0 : -viewport.y * scaleY
		ctx.setTransform(scaleX, 0, 0, scaleY, translateX, translateY)
	}

	private updateSurfaceStyle(viewport: Rect): void {
		this.canvas.style.left = `${viewport.x}px`
		this.canvas.style.top = `${viewport.y}px`
		this.canvas.style.width = `${viewport.width}px`
		this.canvas.style.height = `${viewport.height}px`
	}

	private shiftSurfaceBitmap(plan: ViewportShiftPlan, viewport: Rect): boolean {
		const ctx = this.requireMainCtx()
		const { canvas } = this
		const shift = resolvePhysicalViewportShift(
			plan,
			{ width: canvas.width, height: canvas.height },
			viewport,
		)
		if (!shift) {
			return false
		}
		const shiftX = shift.x
		const shiftY = shift.y

		const sourceX = Math.max(0, -shiftX)
		const sourceY = Math.max(0, -shiftY)
		const destinationX = Math.max(0, shiftX)
		const destinationY = Math.max(0, shiftY)
		const copyWidth = canvas.width - Math.abs(shiftX)
		const copyHeight = canvas.height - Math.abs(shiftY)

		ctx.save()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		ctx.globalAlpha = 1
		ctx.globalCompositeOperation = 'copy'
		ctx.drawImage(
			canvas,
			sourceX,
			sourceY,
			copyWidth,
			copyHeight,
			destinationX,
			destinationY,
			copyWidth,
			copyHeight,
		)

		if (shiftX > 0) {
			ctx.clearRect(0, 0, shiftX, canvas.height)
		} else if (shiftX < 0) {
			ctx.clearRect(canvas.width + shiftX, 0, -shiftX, canvas.height)
		}
		if (shiftY > 0) {
			ctx.clearRect(0, 0, canvas.width, shiftY)
		} else if (shiftY < 0) {
			ctx.clearRect(0, canvas.height + shiftY, canvas.width, -shiftY)
		}

		ctx.restore()
		this.applySurfaceTransform(ctx)
		return true
	}

	private resizeSurface(): void {
		const viewport = this.resolveViewport()
		const pixelRatio = this.resolvePixelRatio(viewport)
		this.effectivePixelRatio = pixelRatio

		this.updateSurfaceStyle(viewport)

		if (this.workerPort) {
			if (this.workerTransferred || (this.logicalWidth > 0 && this.logicalHeight > 0)) {
				this.setSizeWorker(this.logicalWidth, this.logicalHeight, pixelRatio)
			}
			return
		}

		const bitmapWidth =
			viewport.width > 0 ? Math.max(1, Math.round(viewport.width * pixelRatio)) : 0
		const bitmapHeight =
			viewport.height > 0 ? Math.max(1, Math.round(viewport.height * pixelRatio)) : 0
		if (this.canvas.width !== bitmapWidth) {
			this.canvas.width = bitmapWidth
		}
		if (this.canvas.height !== bitmapHeight) {
			this.canvas.height = bitmapHeight
		}
		if (bitmapWidth > 0 && bitmapHeight > 0) {
			this.applySurfaceTransform(this.requireMainCtx())
		}
	}

	public render() {
		if (this.disposed) return this
		if (this.workerPort) {
			return this.renderWorker()
		}

		// static + cached: блит снимка, фигуры не трогаем даже при dirty
		if (this.staticMode && this.cached) {
			if (!this.isDirty()) return this
			this.blitCache()
			this.clearDirtyState()
			return this
		}

		if (!this.isDirty()) return this

		this.renderShapesContent()
		this.clearDirtyState()

		return this
	}

	public setShape(shape: ShapeDrawingContext, options?: SetShapeOptions) {
		if (this.disposed) return this
		if (this.workerPort) {
			if (!options?.source) {
				throw new Error('Layer.setShape requires options.source when workerRenderer is enabled')
			}
			this.shapeSources.set(shape.id, options.source)
		}

		this.invalidateCache()
		const prev = this.shapes.get(shape.id)

		// Нестандартный composite меняет пиксели вне bounds — только full dirty.
		if (
			requiresFullDirtyForComposite(shape) ||
			(prev !== undefined && requiresFullDirtyForComposite(prev))
		) {
			this.shapes.set(shape.id, shape)
			this.sortedShapesCache = null
			this.interactiveShapesCache = null
			this.makeDirty()

			const nextBounds = this.resolveWorldBounds(shape)
			if (nextBounds) this.shapeBoundsCache.set(shape.id, nextBounds)
			else this.shapeBoundsCache.delete(shape.id)

			this.markSpatialIndexDirty()
			this.postWorkerShapesIfReady()
			return this
		}

		const prevBounds = prev
			? (this.shapeBoundsCache.get(shape.id) ?? this.resolveWorldBounds(prev))
			: undefined
		const nextBounds = this.resolveWorldBounds(shape)

		this.shapes.set(shape.id, shape)
		this.sortedShapesCache = null
		this.interactiveShapesCache = null

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

		this.markSpatialIndexDirty()
		this.postWorkerShapesIfReady()
		return this
	}

	public removeShape(shape: ShapeDrawingContext) {
		if (this.disposed) return this
		this.invalidateCache()
		this.shapeSources.delete(shape.id)

		// Нестандартный composite мог изменить весь canvas — только full dirty.
		if (requiresFullDirtyForComposite(shape)) {
			this.shapes.delete(shape.id)
			this.sortedShapesCache = null
			this.interactiveShapesCache = null
			this.shapeBoundsCache.delete(shape.id)
			this.makeDirty()
			this.markSpatialIndexDirty()
			this.postWorkerShapesIfReady()
			return this
		}

		const bounds = this.shapeBoundsCache.get(shape.id) ?? this.resolveWorldBounds(shape)

		this.shapes.delete(shape.id)
		this.sortedShapesCache = null
		this.interactiveShapesCache = null
		this.shapeBoundsCache.delete(shape.id)

		if (bounds) this.makeDirty(bounds)
		else this.makeDirty()

		this.markSpatialIndexDirty()
		this.postWorkerShapesIfReady()
		return this
	}

	/**
	 * Hit-test в логических координатах слоя.
	 * opacity фигуры не влияет на попадание: `opacity === 0` остаётся кликабельным намеренно
	 * (невидимый hit-area). CSS opacity слоя учитывается в `Canvas.hitTest`.
	 * Возвращает верхнюю фигуру или undefined.
	 */
	public hitTest(x: number, y: number): HitTestResult | undefined {
		if (this.disposed) return undefined
		const viewport = this.resolveViewport()
		if (
			this.surfaceConfigured &&
			(x < viewport.x ||
				y < viewport.y ||
				x >= viewport.x + viewport.width ||
				y >= viewport.y + viewport.height)
		) {
			return undefined
		}

		if (this.shouldUseSpatialIndex()) {
			this.ensureSpatialIndex()
			const candidates = sortShapesByZIndex(this.spatialIndex.queryCandidates(x, y), 'desc')
			return this.hitTestShapes(candidates, x, y)
		}

		return this.hitTestShapes(this.getInteractiveShapes(), x, y)
	}

	private shouldUseSpatialIndex(): boolean {
		if (!this.spatialIndexConfig.enabled) return false
		return this.getInteractiveShapes().length >= this.spatialIndexConfig.threshold
	}

	private markSpatialIndexDirty(): void {
		this.spatialIndexDirty = true
	}

	private ensureSpatialIndex(): void {
		if (!this.spatialIndexDirty) return

		this.spatialIndex.rebuild(this.getInteractiveShapes(), shape => {
			const cached = this.shapeBoundsCache.get(shape.id)
			if (cached) return cached
			return this.resolveWorldBounds(shape)
		})
		this.spatialIndexDirty = false
	}

	private hitTestShapes(
		shapes: ShapeDrawingContext[],
		x: number,
		y: number,
	): HitTestResult | undefined {
		for (const shape of shapes) {
			if (shape.listening === false) continue
			if (!shape.contains) continue

			const transforms = shape.transforms ?? []
			const local = invertPointThroughTransforms({ x, y }, transforms)
			if (!local) continue

			if (shape.contains(local.x, local.y, shape.hitStrokeWidth)) {
				return {
					shapeId: shape.id,
					meta: shape.meta,
					zIndex: shape.shapeParams.zIndex,
				}
			}
		}

		return undefined
	}

	private getInteractiveShapes(): ShapeDrawingContext[] {
		if (!this.interactiveShapesCache) {
			const interactive = Array.from(this.shapes.values()).filter(
				shape => shape.listening !== false && shape.contains !== undefined,
			)
			this.interactiveShapesCache = sortShapesByZIndex(interactive, 'desc')
		}
		return this.interactiveShapesCache
	}

	private isDirty(): boolean {
		return this.dirtyFull || this.dirtyRects.length > 0
	}

	private clearDirtyState() {
		this.dirtyFull = false
		this.dirtyRects = []
	}

	private invalidateCache() {
		this.cached = false
		this.cacheCanvas = null
	}

	private requireMainCtx(): CanvasRenderingContext2D {
		if (!this.ctx) {
			throw new Error('Layer 2d context is not available in workerRenderer mode')
		}
		return this.ctx
	}

	/**
	 * Первый setSize с известными размерами: transferControlToOffscreen → init → ready.
	 * Повторный setSize: только resize (bitmap уже у worker).
	 */
	private setSizeWorker(logicalWidth: number, logicalHeight: number, dpr: number) {
		const port = this.workerPort
		if (!port) return

		if (!this.workerTransferred) {
			// MDN: transferControlToOffscreen нельзя вызывать, если уже был getContext.
			const offscreen = this.canvas.transferControlToOffscreen()
			this.workerTransferred = true
			port.post(
				{
					type: 'init',
					protocolVersion: WORKER_PROTOCOL_VERSION,
					logicalWidth,
					logicalHeight,
					dpr,
					canvas: offscreen,
				},
				[offscreen],
			)
			// MockWorkerPort отвечает ready синхронно внутри post; реальный Worker — async.
			return
		}

		port.post({
			type: 'resize',
			logicalWidth,
			logicalHeight,
			dpr,
		})
	}

	private handleWorkerMessage(message: WorkerToMainMessage) {
		if (message.type === 'ready') {
			this.workerReady = true
			// Фигуры могли быть добавлены до init (setShape до setSize) — догоняем worker.
			if (this.shapes.size > 0) {
				this.postWorkerShapesIfReady()
			}
			if (this.isDirty()) {
				this.onDirty?.()
			}
			return
		}
		if (message.type === 'error') {
			throw new Error(`Layer worker error (${message.code}): ${message.message}`)
		}
	}

	/**
	 * Полный replace snapshots в worker.
	 * Вызывается после setShape/removeShape/invalidateShape, когда port уже ready.
	 */
	private postWorkerShapesIfReady() {
		if (!this.workerPort || !this.workerReady) return

		this.revision += 1
		const shapes = shapesMapToWorkerSnapshots(this.shapes, this.shapeSources)
		this.workerPort.post({
			type: 'setShapes',
			revision: this.revision,
			shapes,
		})
	}

	/**
	 * Worker render: не красим на main; шлём dirty-intent.
	 * Dirty очищается сразу после post (не ждём frameDone) — проще coalescing на main.
	 */
	private renderWorker() {
		if (!this.isDirty()) return this
		if (!this.workerPort || !this.workerReady) {
			// Ждём ready после init; dirty сохраняется для следующего render().
			return this
		}

		this.revision += 1
		this.workerPort.post({
			type: 'render',
			revision: this.revision,
			dirtyFull: this.dirtyFull,
			dirtyRects: this.dirtyFull ? undefined : this.dirtyRects.slice(),
		})
		this.clearDirtyState()
		return this
	}

	private captureCache() {
		const width = this.canvas.width
		const height = this.canvas.height
		const surface = createCacheSurface(width, height)
		this.cacheCanvas = surface.canvas
		surface.ctx.drawImage(this.canvas, 0, 0)
		this.cached = true
	}

	private blitCache() {
		if (!this.cacheCanvas) return

		const ctx = this.requireMainCtx()
		const { canvas } = this

		// Кеш в физических пикселях — блитим в identity CTM, иначе при DPR>1 снимок масштабируется дважды.
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.drawImage(this.cacheCanvas, 0, 0)
		this.applySurfaceTransform(ctx)
	}

	private renderShapesContent() {
		const ctx = this.requireMainCtx()
		const { opacity } = this
		const shapes = this.getSortedShapes()
		const viewport = this.resolveViewport()
		const dirtyRegion = this.dirtyFull ? undefined : unionRectList(this.dirtyRects)
		const renderer = this.renderer

		if (renderer) {
			withRenderViewport(
				ctx,
				viewport,
				() => {
					renderer(
						ctx,
						{
							opacity,
							shapes: this.shapes,
							viewport,
							worldWidth: this.logicalWidth,
							worldHeight: this.logicalHeight,
							dirtyRegion,
							fullRedraw: this.dirtyFull,
						},
						renderShapes,
					)
				},
				dirtyRegion ?? viewport,
			)
			return
		}

		const regions =
			this.dirtyRects.length <= MAX_PARTIAL_REDRAW_REGIONS
				? this.dirtyRects
				: dirtyRegion
					? [dirtyRegion]
					: []

		if (!this.dirtyFull && regions.length > 0) {
			regions.forEach(region => {
				withRenderViewport(
					ctx,
					viewport,
					() => {
						ctx.save()
						ctx.beginPath()
						ctx.rect(region.x, region.y, region.width, region.height)
						ctx.clip()
						ctx.clearRect(region.x, region.y, region.width, region.height)
						renderShapes(ctx, this.getShapesForRegion(shapes, region))
						ctx.restore()
					},
					region,
				)
			})
			return
		}

		withRenderViewport(ctx, viewport, () => {
			ctx.clearRect(viewport.x, viewport.y, viewport.width, viewport.height)
			renderShapes(ctx, this.getShapesForRegion(shapes, viewport))
		})
	}

	private resolveWorldBounds(shape: ShapeDrawingContext): Rect | undefined {
		const local = shape.getLocalBounds?.()
		if (!local) return undefined
		const requestedHitStrokeWidth = shape.hitStrokeWidth ?? 0
		const hitStrokeWidth = Number.isFinite(requestedHitStrokeWidth)
			? Math.max(0, requestedHitStrokeWidth)
			: 0
		const hitBounds = hitStrokeWidth > 0 ? inflateRect(local, hitStrokeWidth) : local
		const world = transformRectToWorld(hitBounds, shape.transforms ?? [])
		return inflateWorldBoundsForEffects(world, shape)
	}

	private getShapesForRegion(shapes: ShapeDrawingContext[], region: Rect): ShapeDrawingContext[] {
		return shapes.filter(shape => {
			const bounds = this.shapeBoundsCache.get(shape.id)
			return !bounds || rectsIntersect(bounds, region)
		})
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
		let targetWidth = Math.max(1, Math.round(this.logicalWidth * this.effectivePixelRatio))
		let targetHeight = Math.max(1, Math.round(this.logicalHeight * this.effectivePixelRatio))

		if (maxSize && maxSize > 0) {
			const maxSide = Math.max(targetWidth, targetHeight)
			if (maxSide > maxSize) {
				const scale = maxSize / maxSide
				targetWidth = Math.max(1, Math.round(targetWidth * scale))
				targetHeight = Math.max(1, Math.round(targetHeight * scale))
			}
		}

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

		this.renderToContext(exportCtx, {
			width: targetWidth,
			height: targetHeight,
			applyOpacity,
		})

		return exportCanvas
	}

	/**
	 * Renders the full vector scene into an existing target without allocating
	 * a full-size intermediate bitmap.
	 */
	public renderToContext(
		ctx: CanvasRenderingContext2D,
		{
			width,
			height,
			applyOpacity = true,
			sceneWidth = this.logicalWidth,
			sceneHeight = this.logicalHeight,
		}: LayerRenderTarget,
	): void {
		if (this.disposed) return
		if (this.workerPort) {
			throw new Error('Layer.renderToContext() is not supported when workerRenderer is enabled')
		}
		assertPositiveFinite(width, 'render target width')
		assertPositiveFinite(height, 'render target height')
		if (this.logicalWidth <= 0 || this.logicalHeight <= 0) return
		assertPositiveFinite(sceneWidth, 'render scene width')
		assertPositiveFinite(sceneHeight, 'render scene height')

		const viewport = {
			x: 0,
			y: 0,
			width: this.logicalWidth,
			height: this.logicalHeight,
		}
		const renderer = this.exportRenderer ?? this.renderer

		ctx.save()
		ctx.setTransform(width / sceneWidth, 0, 0, height / sceneHeight, 0, 0)
		ctx.globalAlpha *= applyOpacity ? this.opacity : 1

		withRenderViewport(ctx, viewport, () => {
			if (renderer) {
				renderer(
					ctx,
					{
						opacity: this.opacity,
						shapes: this.shapes,
						viewport,
						worldWidth: this.logicalWidth,
						worldHeight: this.logicalHeight,
						fullRedraw: true,
					},
					renderShapes,
				)
			} else {
				renderShapes(ctx, this.getSortedShapes())
			}
		})
		ctx.restore()
	}

	public toDataURL(options?: LayerExportOptions) {
		if (this.disposed) {
			throw new Error('Layer is disposed')
		}
		if (this.workerPort) {
			throw new Error('Layer.toDataURL() is not supported when workerRenderer is enabled')
		}
		const exportCanvas = this.createExportCanvas(options)
		const type = options?.type ?? 'image/png'
		return exportCanvas.toDataURL(type, options?.quality)
	}

	public async toBlob(options?: LayerExportOptions): Promise<Blob> {
		if (this.disposed) {
			throw new Error('Layer is disposed')
		}
		if (this.workerPort) {
			throw new Error('Layer.toBlob() is not supported when workerRenderer is enabled')
		}
		const exportCanvas = this.createExportCanvas(options)
		const type = options?.type ?? 'image/png'
		const quality = options?.quality

		return await new Promise<Blob>((resolve, reject) => {
			exportCanvas.toBlob(
				blob => {
					if (blob) {
						resolve(blob)
						return
					}
					reject(new Error('failed to export layer: toBlob returned null'))
				},
				type,
				quality,
			)
		})
	}
}
