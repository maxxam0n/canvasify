import type { CanvasHitTestResult } from '../model/hit-test.types'

import type {
	DragEndEvent,
	DragHelper,
	DragHelperFilter,
	DragHelperHandlers,
	DragHelperOptions,
	DragMoveEvent,
	DragStartEvent,
} from './drag.types'

const clientToLogical = (
	target: HTMLElement,
	clientX: number,
	clientY: number,
): { x: number; y: number } => {
	const rect = target.getBoundingClientRect()
	return {
		x: clientX - rect.left,
		y: clientY - rect.top,
	}
}

const isDraggable = (hit: CanvasHitTestResult, filter: DragHelperFilter | undefined): boolean => {
	if (!filter) return true
	if (typeof filter === 'string') return hit.shapeId === filter
	return filter(hit)
}

export const createDragHelper = (options: DragHelperOptions): DragHelper => {
	const { target, hitTest, filter } = options
	const handlers: DragHelperHandlers = {
		onStart: options.onStart,
		onMove: options.onMove,
		onEnd: options.onEnd,
		onCancel: options.onCancel,
	}

	let attached = false
	let destroyed = false
	let dragging = false
	let activeHit: CanvasHitTestResult | undefined
	let activePointerId: number | undefined
	let startX = 0
	let startY = 0

	const resolveHit = (clientX: number, clientY: number): CanvasHitTestResult | undefined => {
		const { x, y } = clientToLogical(target, clientX, clientY)
		return hitTest(x, y)
	}

	const makeStartEvent = (event: PointerEvent, hit: CanvasHitTestResult): DragStartEvent => {
		const { x, y } = clientToLogical(target, event.clientX, event.clientY)
		return { x, y, hit, nativeEvent: event }
	}

	const makeMoveEvent = (event: PointerEvent, hit: CanvasHitTestResult): DragMoveEvent => {
		const { x, y } = clientToLogical(target, event.clientX, event.clientY)
		return { x, y, dx: x - startX, dy: y - startY, hit, nativeEvent: event }
	}

	const makeEndEvent = (event: PointerEvent, hit: CanvasHitTestResult): DragEndEvent => {
		const { x, y } = clientToLogical(target, event.clientX, event.clientY)
		return { x, y, dx: x - startX, dy: y - startY, hit, nativeEvent: event }
	}

	const removeDragListeners = (): void => {
		target.removeEventListener('pointermove', onPointerMove)
		target.removeEventListener('pointerup', onPointerUp)
		target.removeEventListener('pointercancel', onPointerCancel)
	}

	const releaseCapture = (): void => {
		if (activePointerId === undefined) return
		if (target.hasPointerCapture(activePointerId)) {
			target.releasePointerCapture(activePointerId)
		}
		activePointerId = undefined
	}

	const resetDragState = (): void => {
		removeDragListeners()
		releaseCapture()
		dragging = false
		activeHit = undefined
		startX = 0
		startY = 0
	}

	const finishDrag = (event: PointerEvent, cancelled: boolean): void => {
		if (!dragging || activeHit === undefined) return
		if (activePointerId !== undefined && event.pointerId !== activePointerId) return

		const endEvent = makeEndEvent(event, activeHit)
		// Завершение сессии: снятие capture и отписка от move/up.
		resetDragState()

		if (cancelled) {
			handlers.onCancel?.(endEvent)
		} else {
			handlers.onEnd?.(endEvent)
		}
	}

	const onPointerMove = (event: PointerEvent): void => {
		if (destroyed || !dragging || activeHit === undefined) return
		if (activePointerId !== undefined && event.pointerId !== activePointerId) return

		handlers.onMove?.(makeMoveEvent(event, activeHit))
	}

	const onPointerUp = (event: PointerEvent): void => {
		finishDrag(event, false)
	}

	const onPointerCancel = (event: PointerEvent): void => {
		finishDrag(event, true)
	}

	const onPointerDown = (event: PointerEvent): void => {
		if (destroyed || dragging) return

		const hit = resolveHit(event.clientX, event.clientY)
		if (!hit || !isDraggable(hit, filter)) return

		// Захват указателя: drag продолжается за пределами target.
		target.setPointerCapture(event.pointerId)

		dragging = true
		activeHit = hit
		activePointerId = event.pointerId

		const { x, y } = clientToLogical(target, event.clientX, event.clientY)
		startX = x
		startY = y

		handlers.onStart?.(makeStartEvent(event, hit))

		// Слушатели move/up только на время активного drag.
		target.addEventListener('pointermove', onPointerMove)
		target.addEventListener('pointerup', onPointerUp)
		target.addEventListener('pointercancel', onPointerCancel)
	}

	const attach = (): void => {
		if (destroyed || attached) return
		attached = true
		target.addEventListener('pointerdown', onPointerDown)
	}

	const detach = (): void => {
		if (!attached) return
		attached = false
		target.removeEventListener('pointerdown', onPointerDown)

		if (dragging && activeHit !== undefined) {
			resetDragState()
		}
	}

	const destroy = (): void => {
		if (destroyed) return
		destroyed = true
		detach()
		resetDragState()
	}

	const setHandlers = (next: Partial<DragHelperHandlers>): void => {
		if (next.onStart !== undefined) handlers.onStart = next.onStart
		if (next.onMove !== undefined) handlers.onMove = next.onMove
		if (next.onEnd !== undefined) handlers.onEnd = next.onEnd
		if (next.onCancel !== undefined) handlers.onCancel = next.onCancel
	}

	return { attach, detach, destroy, setHandlers }
}
