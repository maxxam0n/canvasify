export type CanvasExportOptions = {
	/** MIME‑тип */
	type?: 'image/png' | 'image/jpeg' | 'image/webp'

	/** Для 'image/jpeg' или 'image/webp' в диапазоне 0..1 */
	quality?: number

	/** Сплошная заливка фона перед отрисовкой слоев (полезно для JPEG). */
	background?: string

	/**
	 * Если задано, изображение будет уменьшено так, что
	 * max(width, height) <= maxSize (в пикселях канваса).
	 */
	maxSize?: number

	/**
	 * Управляет сглаживанием при уменьшении. По умолчанию — браузер.
	 * Установите false для пиксель‑арта.
	 */
	imageSmoothingEnabled?: boolean
}

export type LayerExportOptions = CanvasExportOptions & {
	/** Применять layer.opacity к экспортируемым пикселям (по умолчанию: true). */
	applyOpacity?: boolean
}

export type CanvasComponentExpose = {
	toBlob: (options?: CanvasExportOptions) => Promise<Blob>

	toDataURL: (options?: CanvasExportOptions) => string

	layerToBlob: (name: string, options?: LayerExportOptions) => Promise<Blob>

	layerToDataURL: (name: string, options?: LayerExportOptions) => string
}
