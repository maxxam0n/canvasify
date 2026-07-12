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
	RenderLayer,
	type LayerWorkerRendererOptions,
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
			opacity,
			zIndex,
			spatialIndex,
			workerRenderer,
			onDirty: () => canvas.requestRender(),
		})

		canvas.deleteLayer(name).setLayer(nextLayer)
		setLayer(nextLayer)

		return () => {
			canvas.deleteLayer(name)
			setLayer(null)
		}
	}, [canvas, canvasElement, name, spatialIndex, workerRenderer])

	useEffect(() => {
		if (!layer || !size) return
		layer.setSize(size.width, size.height)
	}, [layer, size])

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

	const style: CSSProperties = useMemo(
		() => ({
			zIndex,
			position: 'absolute',
			top: 0,
			left: 0,
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
