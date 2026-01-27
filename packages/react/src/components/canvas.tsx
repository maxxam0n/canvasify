import { CSSProperties, PropsWithChildren, useEffect, useMemo } from 'react'
import { Canvas as CanvasCore } from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'

export interface CanvasProps extends PropsWithChildren {
	width?: number
	height?: number
	background?: string
}

export const Canvas = ({ children, height = 300, width = 500, background = 'transparent' }: CanvasProps) => {
	const canvasCore = useMemo(() => new CanvasCore(), [])

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
}
