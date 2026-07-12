import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { PathShape } from './Path'

describe('PathShape', () => {
	it('draws path with fill and stroke', () => {
		const { ctx, calls } = createMockContext()

		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 10, y: 0 },
				{ type: 'lineTo', x: 10, y: 10 },
				{ type: 'closePath' },
			],
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 2,
		})

		shape.draw(ctx)

		expect(calls.map(c => c.name)).toEqual([
			'beginPath',
			'moveTo',
			'lineTo',
			'lineTo',
			'closePath',
			'fill',
			'stroke',
		])
	})

	it('hit-tests filled polygon path via segments fallback', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 20, y: 0 },
				{ type: 'lineTo', x: 20, y: 20 },
				{ type: 'lineTo', x: 0, y: 20 },
				{ type: 'closePath' },
			],
			fillColor: 'red',
		})

		expect(shape.contains(10, 10)).toBe(true)
		expect(shape.contains(30, 30)).toBe(false)
	})

	it('supports rect command hit-test', () => {
		const shape = new PathShape({
			commands: [{ type: 'rect', x: 5, y: 5, width: 10, height: 10 }],
			fillColor: 'blue',
		})

		expect(shape.contains(8, 8)).toBe(true)
		expect(shape.contains(0, 0)).toBe(false)
	})

	it('does not hit interior of stroke-only rect', () => {
		const shape = new PathShape({
			commands: [{ type: 'rect', x: 0, y: 0, width: 20, height: 20 }],
			strokeColor: 'black',
			lineWidth: 2,
		})

		expect(shape.contains(10, 10)).toBe(false)
		expect(shape.contains(0, 10)).toBe(true)
		expect(shape.contains(10, 0)).toBe(true)
	})
})
