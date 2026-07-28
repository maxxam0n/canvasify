import {
	CSSProperties,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import {
	Layer as CoreLayer,
	type LayerWorkerRendererOptions,
	type RenderLayer,
	type SpatialIndexOptions,
} from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'
import { LayerContext } from '../contexts/layer-context'

export interface LayerProps extends PropsWithChildren {
	name: string
	opacity?: number
	zIndex?: number
	renderer?: RenderLayer
	exportRenderer?: RenderLayer
	/** Передаётся в конструктор Core Layer; смена prop пересоздаёт слой. */
	spatialIndex?: SpatialIndexOptions
	/**
	 * Experimental: paint в worker через OffscreenCanvas.
	 * Смена prop пересоздаёт слой — держите стабильную ссылку на createWorker / port.
	 */
	workerRenderer?: LayerWorkerRendererOptions
}

export const Layer = ({
	name,
	children,
	renderer,
	exportRenderer,
	opacity = 1,
	zIndex = 0,
	spatialIndex,
	workerRenderer,
}: LayerProps) => {
	const canvas = useContext(CanvasContext)
	const size = useContext(CanvasSizeContext)
	const [layer, setLayer] = useState<CoreLayer | null>(null)
	const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

	if (!canvas) {
		throw new Error('failed to register layer: canvas not found')
	}

	const refCallback = useCallback((node: HTMLCanvasElement | null) => {
		setCanvasElement(node)
	}, [])

	useEffect(() => {
		if (!canvasElement || !canvas) return

		const nextLayer = new CoreLayer({
			name,
			canvas: canvasElement,
			spatialIndex,
			workerRenderer,
			onDirty: () => canvas.requestRender(),
		})

		canvas.deleteLayer(name).setLayer(nextLayer)
		setLayer(nextLayer)

		return () => {
			if (canvas.getLayer(name) === nextLayer) {
				canvas.deleteLayer(name)
			}
			nextLayer.dispose()
			setLayer(currentLayer => (currentLayer === nextLayer ? null : currentLayer))
		}
	}, [canvas, canvasElement, name, spatialIndex, workerRenderer])

	useEffect(() => {
		if (!layer || !size) return
		try {
			layer.setSurface(size)
		} catch (error: unknown) {
			if (canvas.getLayer(name) === layer) {
				canvas.deleteLayer(name)
			}
			layer.dispose()
			setLayer(currentLayer => (currentLayer === layer ? null : currentLayer))
			throw error
		}
	}, [canvas, layer, name, size])

	useEffect(() => {
		if (!layer) return
		layer.setOpacity(opacity)
	}, [layer, opacity])

	useEffect(() => {
		if (!layer) return
		layer.setZIndex(zIndex)
	}, [layer, zIndex])

	useEffect(() => {
		if (!layer || workerRenderer) return
		layer.setRenderer(renderer)
	}, [layer, renderer, workerRenderer])

	useEffect(() => {
		if (!layer) return
		layer.setExportRenderer(exportRenderer)
	}, [layer, exportRenderer])

	const style: CSSProperties = useMemo(
		() => ({
			zIndex,
			position: 'absolute',
		}),
		[zIndex],
	)

	return (
		<LayerContext.Provider value={layer}>
			<canvas ref={refCallback} style={style} />
			{children}
		</LayerContext.Provider>
	)
}
