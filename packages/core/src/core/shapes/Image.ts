import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Rect } from '../../model/rect.types'

/**
 * Parameters for creating an image shape.
 */
export interface ImageParams {
	/** The image source URL or data URI. */
	src: string
	/** The x-coordinate where the image will be drawn. Defaults to 0. */
	x?: number
	/** The y-coordinate where the image will be drawn. Defaults to 0. */
	y?: number
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Optional width in pixels. If not specified, the natural image width will be used. */
	width?: number
	/** Optional height in pixels. If not specified, the natural image height will be used. */
	height?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
	/** Callback function invoked when the image has finished loading. */
	onReady?: () => void
}

/**
 * Status of an image during the loading process.
 */
export type ImageStatus = 'loading' | 'loaded' | 'error'

export class ImageShape implements BaseShape {
	private src: string
	private x: number
	private y: number
	private width?: number
	private height?: number
	private opacity: number
	private zIndex: number
	private onReady?: () => void
	private invalidateListeners = new Set<() => void>()

	private status: ImageStatus = 'loading'
	private image: HTMLImageElement | null = null

	constructor({ src, x = 0, y = 0, width, height, opacity = 1, zIndex = 0, onReady }: ImageParams) {
		this.src = src
		this.x = x
		this.y = y
		this.width = width
		this.height = height
		this.opacity = opacity
		this.zIndex = zIndex
		this.onReady = onReady

		this.loadImage()
			.then(image => {
				this.image = image
				this.status = 'loaded'
				this.onReady?.()
				this.notifyInvalidate()
			})
			.catch((e: Error) => {
				console.error(e)
				this.image = null
				this.status = 'error'
				this.notifyInvalidate()
			})
	}

	public subscribeInvalidate(listener: () => void): () => void {
		this.invalidateListeners.add(listener)
		return () => {
			this.invalidateListeners.delete(listener)
		}
	}

	private notifyInvalidate() {
		for (const listener of this.invalidateListeners) {
			listener()
		}
	}

	private loadImage() {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image()
			image.onload = () => resolve(image)
			image.onerror = () => reject(new Error('Failed to load image'))

			image.src = this.src
		})
	}

	private get actualWidth(): number {
		const { width, status, image } = this

		if (width) return width
		if (status === 'loaded' && image) return image.naturalWidth
		return 0
	}

	private get actualHeight(): number {
		const { height, status, image } = this

		if (height) return height
		if (status === 'loaded' && image) return image.naturalHeight
		return 0
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (this.status === 'loaded' && this.image) {
			ctx.drawImage(this.image, this.x, this.y, this.actualWidth, this.actualHeight)
		}
	}

	public contains(x: number, y: number): boolean {
		const width = this.actualWidth
		const height = this.actualHeight
		if (width <= 0 || height <= 0) return false
		return x >= this.x && x <= this.x + width && y >= this.y && y <= this.y + height
	}

	public getLocalBounds(): Rect | undefined {
		const width = this.actualWidth
		const height = this.actualHeight
		if (width <= 0 || height <= 0) return undefined
		return { x: this.x, y: this.y, width, height }
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			src: this.src,
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
		}
	}
}
