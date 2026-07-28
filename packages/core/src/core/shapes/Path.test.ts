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

	it.each([
		{
			name: 'clockwise',
			startAngle: 0.1,
			endAngle: 2,
			counterclockwise: false,
			expected: {
				minX: 10 + 30 * Math.cos(2),
				minY: 20 + 30 * Math.sin(0.1),
				maxX: 10 + 30 * Math.cos(0.1),
				maxY: 50,
			},
		},
		{
			name: 'counterclockwise',
			startAngle: 0.2,
			endAngle: -2,
			counterclockwise: true,
			expected: {
				minX: 10 + 30 * Math.cos(-2),
				minY: -10,
				maxX: 40,
				maxY: 20 + 30 * Math.sin(0.2),
			},
		},
	])(
		'getLocalBounds includes arc cardinal extrema for a $name sweep',
		({ startAngle, endAngle, counterclockwise, expected }) => {
			const shape = new PathShape({
				commands: [
					{
						type: 'arc',
						x: 10,
						y: 20,
						radius: 30,
						startAngle,
						endAngle,
						counterclockwise,
					},
				],
			})

			const bounds = shape.getLocalBounds()
			expect(bounds).toBeDefined()
			expect(bounds!.x).toBeCloseTo(expected.minX, 12)
			expect(bounds!.y).toBeCloseTo(expected.minY, 12)
			expect(bounds!.x + bounds!.width).toBeCloseTo(expected.maxX, 12)
			expect(bounds!.y + bounds!.height).toBeCloseTo(expected.maxY, 12)
		},
	)

	it.each([
		{ name: 'clockwise', startAngle: 5.8, endAngle: 0.4, counterclockwise: false },
		{ name: 'counterclockwise', startAngle: 0.4, endAngle: 5.8, counterclockwise: true },
	])(
		'getLocalBounds handles a $name arc sweep across zero',
		({ startAngle, endAngle, counterclockwise }) => {
			const shape = new PathShape({
				commands: [
					{
						type: 'arc',
						x: 10,
						y: 20,
						radius: 30,
						startAngle,
						endAngle,
						counterclockwise,
					},
				],
			})

			const bounds = shape.getLocalBounds()
			expect(bounds).toBeDefined()
			expect(bounds!.x + bounds!.width).toBeCloseTo(40, 12)
		},
	)

	it('getLocalBounds includes the exact quadratic Bezier extremum', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'quadraticCurveTo', cpx: 50, cpy: 100, x: 100, y: 20 },
			],
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.y + bounds!.height).toBeCloseTo(500 / 9, 12)
	})

	it('getLocalBounds includes the exact cubic Bezier extremum', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{
					type: 'bezierCurveTo',
					cp1x: 100 / 3,
					cp1y: 4,
					cp2x: 200 / 3,
					cp2y: -3,
					x: 100,
					y: -11,
				},
			],
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.y + bounds!.height).toBeCloseTo(1.16, 12)
	})

	it('uses the rectangle start point for a following curve', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'rect', x: 100, y: 100, width: 20, height: 20 },
				{ type: 'quadraticCurveTo', cpx: 150, cpy: 200, x: 200, y: 100 },
			],
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.y + bounds!.height).toBeCloseTo(150, 12)
	})

	it('continues from the subpath start after closePath', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 20, y: 100 },
				{ type: 'closePath' },
				{ type: 'quadraticCurveTo', cpx: 50, cpy: 200, x: 100, y: 0 },
			],
		})

		const bounds = shape.getLocalBounds()
		expect(bounds).toBeDefined()
		expect(bounds!.y + bounds!.height).toBeCloseTo(100, 12)
	})

	it('closes each stroke subpath to its own start point', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 10, y: 0 },
				{ type: 'closePath' },
				{ type: 'moveTo', x: 100, y: 100 },
				{ type: 'lineTo', x: 110, y: 100 },
				{ type: 'closePath' },
			],
			strokeColor: 'black',
			lineWidth: 2,
		})

		expect(shape.contains(55, 50)).toBe(false)
		expect(shape.contains(105, 100)).toBe(true)
	})

	it('does not fill the gap between separate subpaths', () => {
		const shape = new PathShape({
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 20, y: 0 },
				{ type: 'lineTo', x: 0, y: 20 },
				{ type: 'closePath' },
				{ type: 'moveTo', x: 100, y: 100 },
				{ type: 'lineTo', x: 120, y: 100 },
				{ type: 'lineTo', x: 100, y: 120 },
				{ type: 'closePath' },
			],
			fillColor: 'red',
		})

		expect(shape.contains(5, 5)).toBe(true)
		expect(shape.contains(105, 105)).toBe(true)
		expect(shape.contains(55, 55)).toBe(false)
	})
})
