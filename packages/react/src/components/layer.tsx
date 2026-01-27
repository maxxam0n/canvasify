import { CSSProperties, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Layer as CoreLayer } from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'
import { LayerContext } from '../contexts/layer-context'
import type { LayerProps } from './layer.types'

export const Layer = ({ name, children, renderer, opacity = 1, zIndex = 0 }: LayerProps) => {
	const canvas = useContext(CanvasContext)
	const size = useContext(CanvasSizeContext)
	const [layer, setLayer] = useState<CoreLayer | null>(null)
	const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

	if (!canvas) {
		throw new Error('Ошибка регистрации слоя, canvas не найден')
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
			renderer,
			onDirty: () => canvas.requestRender(),
		})

		if (size) {
			nextLayer.setSize(size.width, size.height)
		}

		canvas.deleteLayer(name).setLayer(nextLayer)
		setLayer(nextLayer)

		return () => {
			canvas.deleteLayer(name)
			setLayer(null)
		}
	}, [canvas, canvasElement, name, opacity, size, renderer])

	useEffect(() => {
		if (!layer || !size) return
		layer.setSize(size.width, size.height)
	}, [layer, size])

	const style: CSSProperties = useMemo(
		() => ({
			zIndex,
			opacity,
			position: 'absolute',
			top: 0,
			left: 0,
		}),
		[zIndex, opacity],
	)

	return (
		<LayerContext.Provider value={layer}>
			<canvas ref={refCallback} style={style} />
			{children}
		</LayerContext.Provider>
	)
}
