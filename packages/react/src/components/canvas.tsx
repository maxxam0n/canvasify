import {
	CSSProperties,
	forwardRef,
	MouseEvent as ReactMouseEvent,
	PointerEvent as ReactPointerEvent,
	PropsWithChildren,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
} from 'react'
import { Canvas as CanvasCore } from '@maxxam0n/canvasify-core'
import type { CanvasComponentExpose, CanvasHitTestResult } from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'

export type CanvasRefExpose = CanvasComponentExpose & {
	getCore: () => CanvasCore
	getLayer: (name: string) => ReturnType<CanvasCore['getLayer']>
	hitTest: (x: number, y: number) => CanvasHitTestResult | undefined
}

export type ShapePointerHandler = (
	event: ReactPointerEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>,
	hit: CanvasHitTestResult,
) => void

export interface CanvasProps extends PropsWithChildren {
	width?: number
	height?: number
	background?: string
	/** Вызывается при pointerdown по фигуре (hit-test в координатах canvas). */
	onShapePointerDown?: ShapePointerHandler
	/** Вызывается при pointermove по фигуре. */
	onShapePointerMove?: ShapePointerHandler
	/** Вызывается при click по фигуре. */
	onShapeClick?: ShapePointerHandler
}

export const Canvas = forwardRef<CanvasRefExpose, CanvasProps>(
	(
		{
			children,
			height = 300,
			width = 500,
			background = 'transparent',
			onShapePointerDown,
			onShapePointerMove,
			onShapeClick,
		},
		ref,
	) => {
		const canvasCore = useMemo(() => new CanvasCore(), [])

		useImperativeHandle(
			ref,
			(): CanvasRefExpose => ({
				getCore: () => canvasCore,
				getLayer: name => canvasCore.getLayer(name),
				hitTest: (x, y) => canvasCore.hitTest(x, y),
				toDataURL: options => canvasCore.toDataURL(options),
				toBlob: options => canvasCore.toBlob(options),
				layerToDataURL: (name, options) => canvasCore.layerToDataURL(name, options),
				layerToBlob: (name, options) => canvasCore.layerToBlob(name, options),
			}),
			[canvasCore],
		)

		useEffect(() => {
			canvasCore.setDefaultBackground(background)
		}, [canvasCore, background])

		useEffect(() => {
			return () => {
				canvasCore.cancelRender()
			}
		}, [canvasCore])

		const size = useMemo(() => ({ width, height }), [width, height])

		const resolveHit = useCallback(
			(event: ReactPointerEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
				const rect = event.currentTarget.getBoundingClientRect()
				const x = event.clientX - rect.left
				const y = event.clientY - rect.top
				return canvasCore.hitTest(x, y)
			},
			[canvasCore],
		)

		const handlePointerDown = useCallback(
			(event: ReactPointerEvent<HTMLDivElement>) => {
				if (!onShapePointerDown) return
				const hit = resolveHit(event)
				if (hit) onShapePointerDown(event, hit)
			},
			[onShapePointerDown, resolveHit],
		)

		const handlePointerMove = useCallback(
			(event: ReactPointerEvent<HTMLDivElement>) => {
				if (!onShapePointerMove) return
				const hit = resolveHit(event)
				if (hit) onShapePointerMove(event, hit)
			},
			[onShapePointerMove, resolveHit],
		)

		const handleClick = useCallback(
			(event: ReactMouseEvent<HTMLDivElement>) => {
				if (!onShapeClick) return
				const hit = resolveHit(event)
				if (hit) onShapeClick(event, hit)
			},
			[onShapeClick, resolveHit],
		)

		const containerStyle: CSSProperties = {
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
			position: 'relative',
		}

		return (
			<CanvasContext.Provider value={canvasCore}>
				<CanvasSizeContext.Provider value={size}>
					<div
						style={containerStyle}
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onClick={handleClick}
					>
						{children}
					</div>
				</CanvasSizeContext.Provider>
			</CanvasContext.Provider>
		)
	},
)

Canvas.displayName = 'Canvas'
