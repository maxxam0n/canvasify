/**
 * Options for exporting canvas content to an image.
 */
export type CanvasExportOptions = {
	/** The MIME type of the exported image. */
	type?: 'image/png' | 'image/jpeg' | 'image/webp'

	/** Quality setting for 'image/jpeg' or 'image/webp' in the range 0 to 1. */
	quality?: number

	/** Solid background fill color applied before rendering layers (useful for JPEG exports). */
	background?: string

	/**
	 * If specified, the image will be downscaled so that
	 * max(width, height) <= maxSize (in canvas pixels).
	 */
	maxSize?: number

	/**
	 * Controls image smoothing when downscaling. Defaults to browser settings.
	 * Set to false for pixel art to preserve sharp edges.
	 */
	imageSmoothingEnabled?: boolean
}

/**
 * Options for exporting a single layer to an image.
 * Extends CanvasExportOptions with layer-specific options.
 */
export type LayerExportOptions = CanvasExportOptions & {
	/** Whether to apply layer.opacity to exported pixels. Defaults to true. */
	applyOpacity?: boolean
}

/**
 * Methods exposed by canvas components for exporting canvas and layer content.
 */
export type CanvasComponentExpose = {
	/**
	 * Exports the entire canvas as a Blob.
	 * @param options - Export options for format, quality, and scaling.
	 * @returns Promise that resolves to a Blob containing the image data.
	 */
	toBlob: (options?: CanvasExportOptions) => Promise<Blob>
	/**
	 * Exports the entire canvas as a data URL string.
	 * @param options - Export options for format, quality, and scaling.
	 * @returns Data URL string containing the image data.
	 */
	toDataURL: (options?: CanvasExportOptions) => string
	/**
	 * Exports a specific layer as a Blob.
	 * @param name - The name of the layer to export.
	 * @param options - Export options for format, quality, and scaling.
	 * @returns Promise that resolves to a Blob containing the layer image data.
	 */
	layerToBlob: (name: string, options?: LayerExportOptions) => Promise<Blob>
	/**
	 * Exports a specific layer as a data URL string.
	 * @param name - The name of the layer to export.
	 * @param options - Export options for format, quality, and scaling.
	 * @returns Data URL string containing the layer image data.
	 */
	layerToDataURL: (name: string, options?: LayerExportOptions) => string
}
