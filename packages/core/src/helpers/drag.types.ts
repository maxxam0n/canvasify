import type { CanvasHitTestResult } from '../model/hit-test.types'

/** Логические координаты canvas (относительно target). */
export type DragLogicalPoint = {
	x: number
	y: number
}

export type DragStartEvent = DragLogicalPoint & {
	hit: CanvasHitTestResult
	nativeEvent: PointerEvent
}

export type DragMoveEvent = DragLogicalPoint & {
	dx: number
	dy: number
	hit: CanvasHitTestResult
	nativeEvent: PointerEvent
}

export type DragEndEvent = DragLogicalPoint & {
	dx: number
	dy: number
	hit: CanvasHitTestResult
	nativeEvent: PointerEvent
}

/** shapeId или предикат — можно ли тащить попадание. */
export type DragHelperFilter = string | ((hit: CanvasHitTestResult) => boolean)

export type DragHelperHandlers = {
	onStart?: (event: DragStartEvent) => void
	onMove?: (event: DragMoveEvent) => void
	onEnd?: (event: DragEndEvent) => void
	onCancel?: (event: DragEndEvent) => void
}

export type DragHelperOptions = {
	target: HTMLElement
	hitTest: (x: number, y: number) => CanvasHitTestResult | undefined
	filter?: DragHelperFilter
} & DragHelperHandlers

export type DragHelper = {
	attach: () => void
	detach: () => void
	destroy: () => void
	setHandlers: (handlers: Partial<DragHelperHandlers>) => void
}
