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

	it('draws each hard-break line separately', () => {
		const { ctx, calls } = createMockContext()

		const shape = new TextShape({
			x: 0,
			y: 10,
			text: 'one\ntwo',
			fillColor: '#111',
			lineHeight: 20,
		})

		shape.draw(ctx)

		expect(calls).toEqual([
			{ name: 'fillText', args: ['one', 0, 10] },
			{ name: 'fillText', args: ['two', 0, 30] },
		])
	})

	it('draws wrapped lines without squeeze maxWidth arg', () => {
		const { ctx, calls } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
			fonts: { load: vi.fn(() => Promise.resolve([])) },
		})

		const shape = new TextShape({
			x: 0,
			y: 0,
			text: 'hello world',
			fillColor: '#111',
			wrap: true,
			maxWidth: 70,
		})

		shape.draw(ctx)

		expect(calls.filter(call => call.name === 'fillText')).toEqual([
			{ name: 'fillText', args: ['hello', 0, 0] },
			{ name: 'fillText', args: ['world', 0, 19.2] },
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

	it('hit-tests multi-line bounds consistently with layout', () => {
		const { ctx } = createMockContext()
		const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement

		vi.stubGlobal('document', {
			createElement: vi.fn(() => canvas),
			fonts: { load: vi.fn(() => Promise.resolve([])) },
		})

		const shape = new TextShape({
			x: 10,
			y: 20,
			text: 'hi\nthere',
			font: '16px sans-serif',
			fillColor: '#000',
			lineHeight: 16,
		})

		const bounds = shape.getLocalBounds()

		expect(bounds).toEqual({ x: 10, y: 8, width: 50, height: 32 })
		expect(shape.contains(15, 16)).toBe(true)
		expect(shape.contains(40, 28)).toBe(true)
		expect(shape.contains(40, 4)).toBe(false)
	})
})
