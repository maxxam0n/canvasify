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

	it('hit-tests filled path with cubic bezier via segments fallback', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 100, y: 0 },
				{ type: 'bezierCurveTo', cp1x: 100, cp1y: 80, cp2x: 0, cp2y: 80, x: 0, y: 0 },
				{ type: 'closePath' },
			],
			fillColor: 'red',
		})

		expect(shape.contains(50, 40)).toBe(true)
		expect(shape.contains(50, -10)).toBe(false)
	})

	it('hit-tests stroke near quadratic curve via segments fallback', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'quadraticCurveTo', cpx: 50, cpy: 100, x: 100, y: 0 },
			],
			strokeColor: 'black',
			lineWidth: 10,
		})

		expect(shape.contains(50, 48)).toBe(true)
		expect(shape.contains(50, 80)).toBe(false)
	})

	it('hit-tests filled path with arc sector via segments fallback', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 50, y: 50 },
				{ type: 'lineTo', x: 90, y: 50 },
				{
					type: 'arc',
					x: 50,
					y: 50,
					radius: 40,
					startAngle: 0,
					endAngle: Math.PI / 2,
				},
				{ type: 'closePath' },
			],
			fillColor: 'green',
		})

		expect(shape.contains(70, 60)).toBe(true)
		expect(shape.contains(10, 10)).toBe(false)
	})

	it('getLocalBounds uses curve samples for tighter arc bounds', () => {
		const shape = new PathShape({
			commands: [
				{
					type: 'arc',
					x: 50,
					y: 50,
					radius: 40,
					startAngle: 0,
					endAngle: Math.PI / 2,
				},
			],
			strokeColor: 'black',
			lineWidth: 2,
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.x).toBeGreaterThanOrEqual(48)
		expect(bounds!.y).toBeGreaterThanOrEqual(48)
		expect(bounds!.width).toBeLessThan(85)
		expect(bounds!.height).toBeLessThan(85)
	})

	it('getLocalBounds samples cubic curve tighter than control points', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'bezierCurveTo', cp1x: 0, cp1y: 100, cp2x: 100, cp2y: 100, x: 100, y: 0 },
			],
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.y + bounds!.height).toBeLessThan(90)
	})
})
