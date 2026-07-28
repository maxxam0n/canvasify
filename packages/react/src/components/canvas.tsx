import {
	CSSProperties,
	forwardRef,
	PropsWithChildren,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react'
import {
	Canvas as CanvasCore,
	createPointerInteraction,
	type CanvasComponentExpose,
	type CanvasHitTestResult,
	type Rect,
	type ShapePointerEvent,
	type ShapeWheelEvent,
} from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'

export type CanvasRefExpose = CanvasComponentExpose & {
	getCore: () => CanvasCore
	getLayer: (name: string) => ReturnType<CanvasCore['getLayer']>
	hitTest: (x: number, y: number) => CanvasHitTestResult | undefined
}

export type ShapePointerHandler = (event: ShapePointerEvent) => void
export type ShapeWheelHandler = (event: ShapeWheelEvent) => void

export interface CanvasProps extends PropsWithChildren {
	width?: number
	height?: number
	background?: string
	/** Видимая область в мировых координатах. Null отображает всю сцену. */
	viewport?: Rect | null
	/** Запрошенный pixel ratio bitmap. По умолчанию используется devicePixelRatio. */
	pixelRatio?: number
	/** Максимальное число физических пикселей для каждого слоя. */
	maxPixelCount?: number
	/** Вызывается при pointerdown по фигуре (логические координаты canvas). */
	onShapePointerDown?: ShapePointerHandler
	/** Вызывается при pointermove по фигуре. */
	onShapePointerMove?: ShapePointerHandler
	/** Вызывается при pointerup по фигуре. */
	onShapePointerUp?: ShapePointerHandler
	/** Курсор вошёл на фигуру. */
	onShapePointerEnter?: ShapePointerHandler
	/** Курсор покинул фигуру. */
	onShapePointerLeave?: ShapePointerHandler
	/** Вызывается при pointercancel по фигуре. */
	onShapePointerCancel?: ShapePointerHandler
	/** Вызывается при wheel над фигурой. */
	onShapeWheel?: ShapeWheelHandler
	/** Вызывается при click по фигуре (down+up на одной фигуре). */
	onShapeClick?: ShapePointerHandler
}

export const Canvas = forwardRef<CanvasRefExpose, CanvasProps>(
	(
		{
			children,
			height = 300,
			width = 500,
			background = 'transparent',
			viewport = null,
			pixelRatio,
			maxPixelCount,
			onShapePointerDown,
			onShapePointerMove,
			onShapePointerUp,
			onShapePointerEnter,
			onShapePointerLeave,
			onShapePointerCancel,
			onShapeWheel,
			onShapeClick,
		},
		ref,
	) => {
		const canvasCore = useMemo(() => new CanvasCore(), [])
		const containerRef = useRef<HTMLDivElement>(null)
		const interactionRef = useRef<ReturnType<typeof createPointerInteraction> | null>(null)

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

		useEffect(() => {
			const target = containerRef.current
			if (!target) return

			const interaction = createPointerInteraction({
				target,
				hitTest: (x, y) => canvasCore.hitTest(x, y),
				getShapeCursor: hit => canvasCore.getLayer(hit.layerName)?.shapes.get(hit.shapeId)?.cursor,
			})
			interactionRef.current = interaction
			interaction.attach()

			return () => {
				interaction.destroy()
				interactionRef.current = null
			}
		}, [canvasCore])

		useEffect(() => {
			interactionRef.current?.setHandlers({
				onPointerDown: onShapePointerDown,
				onPointerMove: onShapePointerMove,
				onPointerUp: onShapePointerUp,
				onPointerEnter: onShapePointerEnter,
				onPointerLeave: onShapePointerLeave,
				onPointerCancel: onShapePointerCancel,
				onWheel: onShapeWheel,
				onClick: onShapeClick,
			})
		}, [
			onShapePointerDown,
			onShapePointerMove,
			onShapePointerUp,
			onShapePointerEnter,
			onShapePointerLeave,
			onShapePointerCancel,
			onShapeWheel,
			onShapeClick,
		])

		const surface = useMemo(
			() => ({ width, height, viewport, pixelRatio, maxPixelCount }),
			[width, height, viewport, pixelRatio, maxPixelCount],
		)

		const containerStyle: CSSProperties = {
			width: `${width}px`,
			height: `${height}px`,
			backgroundColor: background,
			position: 'relative',
		}

		return (
			<CanvasContext.Provider value={canvasCore}>
				<CanvasSizeContext.Provider value={surface}>
					<div ref={containerRef} style={containerStyle}>
						{children}
					</div>
				</CanvasSizeContext.Provider>
			</CanvasContext.Provider>
		)
	},
)

Canvas.displayName = 'Canvas'
