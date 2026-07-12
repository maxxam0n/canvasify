import type { CanvasHitTestResult } from '../model/hit-test.types'

/** Логические координаты canvas (относительно target). */
export type PointerLogicalCoords = {
	x: number
	y: number
}

export type ShapePointerEvent = PointerLogicalCoords & {
	nativeEvent: PointerEvent
	hit: CanvasHitTestResult
}

export type ShapeWheelEvent = PointerLogicalCoords & {
	nativeEvent: WheelEvent
	hit: CanvasHitTestResult
}

export type PointerInteractionHandlers = {
	onPointerDown?: (event: ShapePointerEvent) => void
	onPointerMove?: (event: ShapePointerEvent) => void
	onPointerUp?: (event: ShapePointerEvent) => void
	onPointerEnter?: (event: ShapePointerEvent) => void
	onPointerLeave?: (event: ShapePointerEvent) => void
	onPointerCancel?: (event: ShapePointerEvent) => void
	onWheel?: (event: ShapeWheelEvent) => void
	onClick?: (event: ShapePointerEvent) => void
}

export type PointerInteractionOptions = {
	target: HTMLElement
	hitTest: (x: number, y: number) => CanvasHitTestResult | undefined
	/** Резолв CSS-курсора для фигуры под курсором. */
	getShapeCursor?: (hit: CanvasHitTestResult) => string | undefined
} & PointerInteractionHandlers

export type PointerInteraction = {
	attach: () => void
	detach: () => void
	destroy: () => void
	setHandlers: (handlers: Partial<PointerInteractionHandlers>) => void
}
