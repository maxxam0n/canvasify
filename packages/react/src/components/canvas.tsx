import {
	CSSProperties,
	forwardRef,
	PropsWithChildren,
	useEffect,
	useImperativeHandle,
	useMemo,
} from 'react'
import { Canvas as CanvasCore } from '@maxxam0n/canvasify-core'
import type { CanvasComponentExpose } from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'

export type CanvasRefExpose = CanvasComponentExpose & {
	getCore: () => CanvasCore
	getLayer: (name: string) => ReturnType<CanvasCore['getLayer']>
}

export interface CanvasProps extends PropsWithChildren {
	width?: number
	height?: number
	background?: string
}

export const Canvas = forwardRef<CanvasRefExpose, CanvasProps>(
	({ children, height = 300, width = 500, background = 'transparent' }, ref) => {
		const canvasCore = useMemo(() => new CanvasCore(), [])

		useImperativeHandle(
			ref,
			(): CanvasRefExpose => ({
				getCore: () => canvasCore,
				getLayer: name => canvasCore.getLayer(name),
				toDataURL: options => canvasCore.toDataURL(options),
				toBlob: options => canvasCore.toBlob(options),
				layerToDataURL: (name, options) => canvasCore.layerToDataURL(name, options),
				layerToBlob: (name, options) => canvasCore.layerToBlob(name, options),
			}),
			[canvasCore],
		)

		useEffect(() => {
			return () => {
				canvasCore.cancelRender()
			}
		}, [canvasCore])

		const size = useMemo(() => ({ width, height }), [width, height])

		const containerStyle: CSSProperties = {
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
			position: 'relative',
		}

		return (
			<CanvasContext.Provider value={canvasCore}>
				<CanvasSizeContext.Provider value={size}>
					<div style={containerStyle}>{children}</div>
				</CanvasSizeContext.Provider>
			</CanvasContext.Provider>
		)
	},
)

Canvas.displayName = 'Canvas'
