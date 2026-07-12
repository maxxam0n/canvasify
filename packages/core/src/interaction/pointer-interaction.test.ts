/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanvasHitTestResult } from '../model/hit-test.types'
import { createPointerInteraction } from './pointer-interaction'

const hitA: CanvasHitTestResult = {
	layerName: 'default',
	shapeId: 'shape-a',
	meta: {},
	zIndex: 0,
}

const hitB: CanvasHitTestResult = {
	layerName: 'default',
	shapeId: 'shape-b',
	meta: {},
	zIndex: 1,
}

const mockRect = (left = 0, top = 0, width = 500, height = 300): DOMRect =>
	({
		left,
		top,
		right: left + width,
		bottom: top + height,
		width,
		height,
		x: left,
		y: top,
		toJSON: () => ({}),
	}) as DOMRect

const dispatchPointer = (
	target: HTMLElement,
	type: string,
	clientX: number,
	clientY: number,
): void => {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			clientX,
			clientY,
			pointerId: 1,
		}),
	)
}

describe('createPointerInteraction', () => {
	let target: HTMLDivElement
	let hitTest: ReturnType<typeof vi.fn<(x: number, y: number) => CanvasHitTestResult | undefined>>
	let interaction: ReturnType<typeof createPointerInteraction>

	beforeEach(() => {
		target = document.createElement('div')
		document.body.appendChild(target)
		target.getBoundingClientRect = vi.fn(() => mockRect())

		hitTest = vi.fn<(x: number, y: number) => CanvasHitTestResult | undefined>()
		interaction = createPointerInteraction({
			target,
			hitTest,
		})
		interaction.attach()
	})

	afterEach(() => {
		interaction.destroy()
		target.remove()
	})

	it('fires enter and leave when hovered shape changes', () => {
		const onPointerEnter = vi.fn()
		const onPointerLeave = vi.fn()
		interaction.setHandlers({ onPointerEnter, onPointerLeave })

		hitTest.mockImplementation(x => {
			if (x < 50) return hitA
			if (x < 100) return hitB
			return undefined
		})

		dispatchPointer(target, 'pointermove', 10, 10)
		expect(onPointerEnter).toHaveBeenCalledTimes(1)
		expect(onPointerEnter.mock.calls[0][0].hit.shapeId).toBe('shape-a')

		dispatchPointer(target, 'pointermove', 60, 10)
		expect(onPointerLeave).toHaveBeenCalledTimes(1)
		expect(onPointerLeave.mock.calls[0][0].hit.shapeId).toBe('shape-a')
		expect(onPointerEnter).toHaveBeenCalledTimes(2)
		expect(onPointerEnter.mock.calls[1][0].hit.shapeId).toBe('shape-b')

		dispatchPointer(target, 'pointermove', 200, 10)
		expect(onPointerLeave).toHaveBeenCalledTimes(2)
		expect(onPointerLeave.mock.calls[1][0].hit.shapeId).toBe('shape-b')
	})

	it('fires click only when down and up on the same shape', () => {
		const onClick = vi.fn()
		interaction.setHandlers({ onClick })

		hitTest.mockImplementation(x => {
			if (x < 50) return hitA
			if (x < 100) return hitB
			return undefined
		})

		dispatchPointer(target, 'pointerdown', 10, 10)
		dispatchPointer(target, 'pointerup', 10, 10)
		expect(onClick).toHaveBeenCalledTimes(1)
		expect(onClick.mock.calls[0][0].hit.shapeId).toBe('shape-a')

		dispatchPointer(target, 'pointerdown', 10, 10)
		dispatchPointer(target, 'pointerup', 60, 10)
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('updates cursor from getShapeCursor on hover', () => {
		interaction.destroy()

		const cursorInteraction = createPointerInteraction({
			target,
			hitTest,
			getShapeCursor: hit => (hit.shapeId === 'shape-a' ? 'pointer' : 'grab'),
		})
		cursorInteraction.attach()

		hitTest.mockReturnValue(hitA)
		dispatchPointer(target, 'pointermove', 10, 10)
		expect(target.style.cursor).toBe('pointer')

		hitTest.mockReturnValue(hitB)
		dispatchPointer(target, 'pointermove', 60, 10)
		expect(target.style.cursor).toBe('grab')

		hitTest.mockReturnValue(undefined)
		dispatchPointer(target, 'pointermove', 200, 10)
		expect(target.style.cursor).toBe('')

		cursorInteraction.destroy()
		interaction = createPointerInteraction({ target, hitTest })
		interaction.attach()
	})

	it('fires pointerup, cancel and wheel on shape', () => {
		const onPointerUp = vi.fn()
		const onPointerCancel = vi.fn()
		const onWheel = vi.fn()
		interaction.setHandlers({ onPointerUp, onPointerCancel, onWheel })

		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerup', 10, 10)
		expect(onPointerUp).toHaveBeenCalledTimes(1)

		dispatchPointer(target, 'pointercancel', 10, 10)
		expect(onPointerCancel).toHaveBeenCalledTimes(1)

		target.dispatchEvent(
			new WheelEvent('wheel', {
				bubbles: true,
				clientX: 10,
				clientY: 10,
			}),
		)
		expect(onWheel).toHaveBeenCalledTimes(1)
	})

	it('converts client coords to logical coords via bounding rect', () => {
		target.getBoundingClientRect = vi.fn(() => mockRect(100, 50))
		const onPointerDown = vi.fn()
		interaction.setHandlers({ onPointerDown })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 130, 80)

		expect(onPointerDown).toHaveBeenCalledWith(
			expect.objectContaining({ x: 30, y: 30 }),
		)
	})

	it('stops handling events after destroy', () => {
		const onPointerMove = vi.fn()
		interaction.setHandlers({ onPointerMove })
		hitTest.mockReturnValue(hitA)

		interaction.destroy()
		dispatchPointer(target, 'pointermove', 10, 10)

		expect(onPointerMove).not.toHaveBeenCalled()
	})
})
