/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanvasHitTestResult } from '../model/hit-test.types'
import { createDragHelper } from './drag'

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
	pointerId = 1,
): void => {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			clientX,
			clientY,
			pointerId,
		}),
	)
}

describe('createDragHelper', () => {
	let target: HTMLDivElement
	let hitTest: ReturnType<typeof vi.fn<(x: number, y: number) => CanvasHitTestResult | undefined>>
	let setPointerCapture: ReturnType<typeof vi.fn>
	let releasePointerCapture: ReturnType<typeof vi.fn>
	let hasPointerCapture: ReturnType<typeof vi.fn<(pointerId: number) => boolean>>
	let helper: ReturnType<typeof createDragHelper>

	beforeEach(() => {
		target = document.createElement('div')
		document.body.appendChild(target)
		target.getBoundingClientRect = vi.fn(() => mockRect())

		setPointerCapture = vi.fn()
		releasePointerCapture = vi.fn()
		hasPointerCapture = vi.fn<(pointerId: number) => boolean>(() => true)
		target.setPointerCapture = setPointerCapture
		target.releasePointerCapture = releasePointerCapture
		target.hasPointerCapture = hasPointerCapture

		hitTest = vi.fn<(x: number, y: number) => CanvasHitTestResult | undefined>()
		helper = createDragHelper({ target, hitTest })
		helper.attach()
	})

	afterEach(() => {
		helper.destroy()
		target.remove()
	})

	it('starts drag on pointerdown when hit matches', () => {
		const onStart = vi.fn()
		helper.setHandlers({ onStart })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 10, 20)

		expect(onStart).toHaveBeenCalledTimes(1)
		expect(onStart.mock.calls[0][0]).toMatchObject({
			x: 10,
			y: 20,
			hit: hitA,
		})
		expect(setPointerCapture).toHaveBeenCalledWith(1)
	})

	it('does not start drag when hit is empty', () => {
		const onStart = vi.fn()
		helper.setHandlers({ onStart })
		hitTest.mockReturnValue(undefined)

		dispatchPointer(target, 'pointerdown', 10, 20)

		expect(onStart).not.toHaveBeenCalled()
		expect(setPointerCapture).not.toHaveBeenCalled()
	})

	it('filters drag by shapeId', () => {
		const onStart = vi.fn()
		helper.destroy()

		const filteredHelper = createDragHelper({
			target,
			hitTest,
			filter: 'shape-a',
			onStart,
		})
		filteredHelper.attach()

		hitTest.mockReturnValue(hitB)
		dispatchPointer(target, 'pointerdown', 10, 20)
		expect(onStart).not.toHaveBeenCalled()

		hitTest.mockReturnValue(hitA)
		dispatchPointer(target, 'pointerdown', 10, 20)
		expect(onStart).toHaveBeenCalledTimes(1)

		filteredHelper.destroy()
	})

	it('filters drag by predicate', () => {
		const onStart = vi.fn()
		helper.destroy()

		const filteredHelper = createDragHelper({
			target,
			hitTest,
			filter: hit => hit.shapeId === 'shape-b',
			onStart,
		})
		filteredHelper.attach()

		hitTest.mockReturnValue(hitA)
		dispatchPointer(target, 'pointerdown', 10, 20)
		expect(onStart).not.toHaveBeenCalled()

		hitTest.mockReturnValue(hitB)
		dispatchPointer(target, 'pointerdown', 10, 20)
		expect(onStart).toHaveBeenCalledTimes(1)

		filteredHelper.destroy()
	})

	it('emits logical deltas on move and end', () => {
		const onMove = vi.fn()
		const onEnd = vi.fn()
		helper.setHandlers({ onMove, onEnd })
		hitTest.mockReturnValue(hitA)

		target.getBoundingClientRect = vi.fn(() => mockRect(100, 50))

		dispatchPointer(target, 'pointerdown', 130, 80)
		dispatchPointer(target, 'pointermove', 150, 100)
		dispatchPointer(target, 'pointerup', 160, 110)

		expect(onMove).toHaveBeenCalledTimes(1)
		expect(onMove.mock.calls[0][0]).toMatchObject({
			x: 50,
			y: 50,
			dx: 20,
			dy: 20,
			hit: hitA,
		})

		expect(onEnd).toHaveBeenCalledTimes(1)
		expect(onEnd.mock.calls[0][0]).toMatchObject({
			x: 60,
			y: 60,
			dx: 30,
			dy: 30,
			hit: hitA,
		})
		expect(releasePointerCapture).toHaveBeenCalledWith(1)
	})

	it('accounts for CSS scaling in drag coordinates and deltas', () => {
		Object.defineProperties(target, {
			clientWidth: { configurable: true, value: 500 },
			clientHeight: { configurable: true, value: 300 },
		})
		target.getBoundingClientRect = vi.fn(() => mockRect(100, 50, 1_000, 600))
		const onMove = vi.fn()
		helper.setHandlers({ onMove })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 300, 250)
		dispatchPointer(target, 'pointermove', 500, 350)

		expect(hitTest).toHaveBeenCalledWith(100, 100)
		expect(onMove).toHaveBeenCalledWith(
			expect.objectContaining({
				x: 200,
				y: 150,
				dx: 100,
				dy: 50,
			}),
		)
	})

	it('calls onCancel on pointercancel', () => {
		const onCancel = vi.fn()
		const onEnd = vi.fn()
		helper.setHandlers({ onCancel, onEnd })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 10, 20)
		dispatchPointer(target, 'pointercancel', 15, 25)

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onEnd).not.toHaveBeenCalled()
		expect(releasePointerCapture).toHaveBeenCalledWith(1)
	})

	it('ignores move events from another pointer id', () => {
		const onMove = vi.fn()
		helper.setHandlers({ onMove })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 10, 20, 1)
		dispatchPointer(target, 'pointermove', 20, 30, 2)

		expect(onMove).not.toHaveBeenCalled()
	})

	it('clears a handler when undefined is passed explicitly', () => {
		const onStart = vi.fn()
		helper.setHandlers({ onStart })
		hitTest.mockReturnValue(hitA)

		dispatchPointer(target, 'pointerdown', 10, 20)
		dispatchPointer(target, 'pointerup', 10, 20)
		helper.setHandlers({ onStart: undefined })
		dispatchPointer(target, 'pointerdown', 10, 20)

		expect(onStart).toHaveBeenCalledTimes(1)
	})

	it('stops handling events after destroy', () => {
		const onStart = vi.fn()
		helper.setHandlers({ onStart })
		hitTest.mockReturnValue(hitA)

		helper.destroy()
		dispatchPointer(target, 'pointerdown', 10, 20)

		expect(onStart).not.toHaveBeenCalled()
	})
})
