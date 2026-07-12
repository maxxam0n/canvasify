import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { resetTextMeasureContext } from '../../lib/text-metrics.utils'
import { TextShape } from './Text'

describe('TextShape', () => {
	afterEach(() => {
		resetTextMeasureContext()
		vi.unstubAllGlobals()
	})
	it('invokes onReady when font is ready', async () => {
		const onReady = vi.fn()

		new TextShape({ text: 'hello', onReady })

		await Promise.resolve()

		expect(onReady).toHaveBeenCalledTimes(1)
	})

	it('notifies subscribeInvalidate when font is ready', async () => {
		const onInvalidate = vi.fn()

		const shape = new TextShape({ text: 'hello' })
		shape.subscribeInvalidate(onInvalidate)

		await Promise.resolve()

		expect(onInvalidate).toHaveBeenCalledTimes(1)
	})

	it('draws text with fill and stroke', () => {
		const { ctx, calls } = createMockContext()

		const shape = new TextShape({
			x: 5,
			y: 6,
			text: 'hi',
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 2,
			maxWidth: 120,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'fillText', args: ['hi', 5, 6, 120] },
			{ name: 'strokeText', args: ['hi', 5, 6, 120] },
		])
	})

	it('hit-tests using measureText bounds when available', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
			fonts: { load: vi.fn(() => Promise.resolve([])) },
		})

		const shape = new TextShape({
			x: 10,
			y: 20,
			text: 'hi',
			font: '16px sans-serif',
			fillColor: '#000',
		})

		// mock AABB: [10, 8]..[30, 24]
		expect(shape.contains(15, 16)).toBe(true)
		expect(shape.contains(0, 0)).toBe(false)
		expect(shape.getLocalBounds()).toEqual({ x: 10, y: 8, width: 20, height: 16 })
	})
})
