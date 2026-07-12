import type { CanvasHitTestResult } from '../model/hit-test.types'

import type {
	PointerInteraction,
	PointerInteractionHandlers,
	PointerInteractionOptions,
	ShapePointerEvent,
	ShapeWheelEvent,
} from './pointer-interaction.types'

const shapeKey = (hit: CanvasHitTestResult): string => `${hit.layerName}:${hit.shapeId}`

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

export const createPointerInteraction = (
	options: PointerInteractionOptions,
): PointerInteraction => {
	const { target, hitTest, getShapeCursor } = options
	const handlers: PointerInteractionHandlers = {
		onPointerDown: options.onPointerDown,
		onPointerMove: options.onPointerMove,
		onPointerUp: options.onPointerUp,
		onPointerEnter: options.onPointerEnter,
		onPointerLeave: options.onPointerLeave,
		onPointerCancel: options.onPointerCancel,
		onWheel: options.onWheel,
		onClick: options.onClick,
	}

	let attached = false
	let destroyed = false
	/** Фигура под курсором; undefined — ещё не было move, null — пустое место. */
	let hoveredHit: CanvasHitTestResult | null | undefined
	let pressedKey: string | undefined

	const resolveHit = (clientX: number, clientY: number): CanvasHitTestResult | undefined => {
		const { x, y } = clientToLogical(target, clientX, clientY)
		return hitTest(x, y)
	}

	const makePointerEvent = (
		nativeEvent: PointerEvent,
		hit: CanvasHitTestResult,
	): ShapePointerEvent => {
		const { x, y } = clientToLogical(target, nativeEvent.clientX, nativeEvent.clientY)
		return { x, y, nativeEvent, hit }
	}

	const updateCursor = (hit: CanvasHitTestResult | undefined): void => {
		const cursor = hit && getShapeCursor ? getShapeCursor(hit) : undefined
		target.style.cursor = cursor ?? ''
	}

	const emitLeave = (nativeEvent: PointerEvent, hit: CanvasHitTestResult): void => {
		handlers.onPointerLeave?.(makePointerEvent(nativeEvent, hit))
	}

	const emitEnter = (nativeEvent: PointerEvent, hit: CanvasHitTestResult): void => {
		handlers.onPointerEnter?.(makePointerEvent(nativeEvent, hit))
	}

	const updateHover = (nativeEvent: PointerEvent, hit: CanvasHitTestResult | undefined): void => {
		const prevKey =
			hoveredHit === undefined || hoveredHit === null ? hoveredHit : shapeKey(hoveredHit)
		const nextKey = hit ? shapeKey(hit) : null

		if (prevKey === nextKey) {
			updateCursor(hit)
			return
		}

		// Уход с предыдущей фигуры (включая переход в пустоту).
		if (hoveredHit) {
			emitLeave(nativeEvent, hoveredHit)
		}

		hoveredHit = hit ?? null

		if (hit) {
			emitEnter(nativeEvent, hit)
		}

		updateCursor(hit)
	}

	const onPointerDown = (event: PointerEvent): void => {
		if (destroyed) return

		const hit = resolveHit(event.clientX, event.clientY)
		updateHover(event, hit)

		if (!hit) {
			pressedKey = undefined
			return
		}

		pressedKey = shapeKey(hit)
		handlers.onPointerDown?.(makePointerEvent(event, hit))
	}

	const onPointerMove = (event: PointerEvent): void => {
		if (destroyed) return

		const hit = resolveHit(event.clientX, event.clientY)
		updateHover(event, hit)

		if (hit) {
			handlers.onPointerMove?.(makePointerEvent(event, hit))
		}
	}

	const onPointerUp = (event: PointerEvent): void => {
		if (destroyed) return

		const hit = resolveHit(event.clientX, event.clientY)
		updateHover(event, hit)

		if (hit) {
			handlers.onPointerUp?.(makePointerEvent(event, hit))
		}

		const wasPressed = pressedKey
		pressedKey = undefined

		// click — только если down и up на одной и той же фигуре.
		if (wasPressed && hit && wasPressed === shapeKey(hit)) {
			handlers.onClick?.(makePointerEvent(event, hit))
		}
	}

	const onPointerCancel = (event: PointerEvent): void => {
		if (destroyed) return

		const hit = resolveHit(event.clientX, event.clientY)
		pressedKey = undefined

		if (hit) {
			handlers.onPointerCancel?.(makePointerEvent(event, hit))
		}
	}

	const onPointerLeave = (event: PointerEvent): void => {
		if (destroyed) return

		pressedKey = undefined

		if (hoveredHit) {
			emitLeave(event, hoveredHit)
		}

		hoveredHit = null
		target.style.cursor = ''
	}

	const onWheel = (event: WheelEvent): void => {
		if (destroyed) return

		const hit = resolveHit(event.clientX, event.clientY)
		if (!hit) return

		const { x, y } = clientToLogical(target, event.clientX, event.clientY)
		const wheelEvent: ShapeWheelEvent = { x, y, nativeEvent: event, hit }
		handlers.onWheel?.(wheelEvent)
	}

	const attach = (): void => {
		if (destroyed || attached) return
		attached = true

		target.addEventListener('pointerdown', onPointerDown)
		target.addEventListener('pointermove', onPointerMove)
		target.addEventListener('pointerup', onPointerUp)
		target.addEventListener('pointercancel', onPointerCancel)
		target.addEventListener('pointerleave', onPointerLeave)
		target.addEventListener('wheel', onWheel)
	}

	const detach = (): void => {
		if (!attached) return
		attached = false

		target.removeEventListener('pointerdown', onPointerDown)
		target.removeEventListener('pointermove', onPointerMove)
		target.removeEventListener('pointerup', onPointerUp)
		target.removeEventListener('pointercancel', onPointerCancel)
		target.removeEventListener('pointerleave', onPointerLeave)
		target.removeEventListener('wheel', onWheel)

		hoveredHit = undefined
		pressedKey = undefined
		target.style.cursor = ''
	}

	const destroy = (): void => {
		if (destroyed) return
		destroyed = true
		detach()
	}

	const setHandlers = (next: Partial<PointerInteractionHandlers>): void => {
		if (next.onPointerDown !== undefined) handlers.onPointerDown = next.onPointerDown
		if (next.onPointerMove !== undefined) handlers.onPointerMove = next.onPointerMove
		if (next.onPointerUp !== undefined) handlers.onPointerUp = next.onPointerUp
		if (next.onPointerEnter !== undefined) handlers.onPointerEnter = next.onPointerEnter
		if (next.onPointerLeave !== undefined) handlers.onPointerLeave = next.onPointerLeave
		if (next.onPointerCancel !== undefined) handlers.onPointerCancel = next.onPointerCancel
		if (next.onWheel !== undefined) handlers.onWheel = next.onWheel
		if (next.onClick !== undefined) handlers.onClick = next.onClick
	}

	return { attach, detach, destroy, setHandlers }
}
