import { describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { TextShape } from './Text'

describe('TextShape', () => {
	it('invokes onReady when font is ready', async () => {
		const onReady = vi.fn()

		new TextShape({ text: 'hello', onReady })

		await Promise.resolve()

		expect(onReady).toHaveBeenCalledTimes(1)
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
})
