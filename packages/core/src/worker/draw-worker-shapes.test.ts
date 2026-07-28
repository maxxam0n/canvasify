import { describe, expect, it } from 'vitest'

import { createMockContext } from '../__tests__/test.utils'
import { drawWorkerShapes } from './draw-worker-shapes'
import type { WorkerShapeSnapshot } from './worker.types'

const baseOptions = {
	dirtyFull: true,
	dirtyRects: [] as { x: number; y: number; width: number; height: number }[],
	logicalWidth: 200,
	logicalHeight: 100,
}

const rect = (
	overrides: Partial<Extract<WorkerShapeSnapshot, { kind: 'rect' }>> = {},
): WorkerShapeSnapshot => ({
	kind: 'rect',
	id: 'r1',
	zIndex: 0,
	opacity: 1,
	x: 10,
	y: 20,
	width: 30,
	height: 40,
	fillColor: '#ff0000',
	...overrides,
})

const circle = (
	overrides: Partial<Extract<WorkerShapeSnapshot, { kind: 'circle' }>> = {},
): WorkerShapeSnapshot => ({
	kind: 'circle',
	id: 'c1',
	zIndex: 1,
	opacity: 0.8,
	cx: 50,
	cy: 60,
	radius: 15,
	fillColor: '#00ff00',
	...overrides,
})

describe('drawWorkerShapes', () => {
	it('sorts by zIndex asc and draws geometry', () => {
		const { ctx, calls } = createMockContext()

		drawWorkerShapes(
			ctx,
			[circle({ id: 'top', zIndex: 5 }), rect({ id: 'bottom', zIndex: 1 })],
			baseOptions,
		)

		const clear = calls.find(c => c.name === 'clearRect')
		expect(clear?.args).toEqual([0, 0, 200, 100])

		const fillRects = calls.filter(c => c.name === 'fillRect')
		const arcs = calls.filter(c => c.name === 'arc')
		expect(fillRects).toHaveLength(1)
		expect(fillRects[0].args).toEqual([10, 20, 30, 40])
		expect(arcs).toHaveLength(1)
		expect(arcs[0].args).toEqual([50, 60, 15, 0, Math.PI * 2])

		// Нижний zIndex рисуется раньше: fillRect до arc.
		const fillRectIndex = calls.findIndex(c => c.name === 'fillRect')
		const arcIndex = calls.findIndex(c => c.name === 'arc')
		expect(fillRectIndex).toBeLessThan(arcIndex)
	})

	it('applies opacity, effects and transforms around geometry', () => {
		const { ctx, calls } = createMockContext()

		drawWorkerShapes(
			ctx,
			[
				rect({
					opacity: 0.5,
					shadowColor: 'rgba(0,0,0,0.3)',
					shadowBlur: 4,
					globalCompositeOperation: 'multiply',
					transforms: [{ type: 'translate', translateX: 5, translateY: 7 }],
				}),
			],
			baseOptions,
		)

		expect(calls.some(c => c.name === 'save')).toBe(true)
		expect(calls.some(c => c.name === 'restore')).toBe(true)
		expect(ctx.globalAlpha).toBe(0.5)
		expect(ctx.globalCompositeOperation).toBe('multiply')
		expect(ctx.shadowColor).toBe('rgba(0,0,0,0.3)')
		expect(ctx.shadowBlur).toBe(4)
		expect(calls.some(c => c.name === 'translate' && c.args[0] === 5 && c.args[1] === 7)).toBe(true)
		expect(calls.some(c => c.name === 'fillRect')).toBe(true)
	})

	it('clips and clears dirty region instead of full clear', () => {
		const { ctx, calls } = createMockContext()
		const dirty = { x: 8, y: 12, width: 40, height: 25 }

		drawWorkerShapes(ctx, [rect()], {
			dirtyFull: false,
			dirtyRects: [dirty],
			logicalWidth: 200,
			logicalHeight: 100,
		})

		expect(calls.filter(c => c.name === 'clearRect')).toEqual([
			{ name: 'clearRect', args: [8, 12, 40, 25] },
		])
		expect(calls.some(c => c.name === 'clip')).toBe(true)
		expect(calls.some(c => c.name === 'rect' && c.args[0] === 8 && c.args[1] === 12)).toBe(true)
		expect(calls.some(c => c.name === 'fillRect')).toBe(true)
	})

	it('draws ellipse, line, polygon and path', () => {
		const { ctx, calls } = createMockContext()

		drawWorkerShapes(
			ctx,
			[
				{
					kind: 'ellipse',
					id: 'e',
					zIndex: 0,
					opacity: 1,
					cx: 1,
					cy: 2,
					radiusX: 3,
					radiusY: 4,
					rotation: 0.25,
					fillColor: '#abc',
				},
				{
					kind: 'line',
					id: 'l',
					zIndex: 1,
					opacity: 1,
					x1: 0,
					y1: 0,
					x2: 10,
					y2: 10,
					strokeColor: '#000',
					lineWidth: 2,
				},
				{
					kind: 'polygon',
					id: 'p',
					zIndex: 2,
					opacity: 1,
					points: [
						{ x: 0, y: 0 },
						{ x: 5, y: 0 },
						{ x: 5, y: 5 },
					],
					closed: true,
					fillColor: '#def',
				},
				{
					kind: 'path',
					id: 'path',
					zIndex: 3,
					opacity: 1,
					commands: [
						{ type: 'moveTo', x: 0, y: 0 },
						{ type: 'lineTo', x: 1, y: 1 },
						{ type: 'closePath' },
					],
					fillColor: '#111',
				},
			],
			baseOptions,
		)

		expect(calls.some(c => c.name === 'ellipse')).toBe(true)
		expect(calls.some(c => c.name === 'moveTo' && c.args[0] === 0 && c.args[1] === 0)).toBe(true)
		expect(calls.some(c => c.name === 'lineTo' && c.args[0] === 10 && c.args[1] === 10)).toBe(true)
		expect(calls.some(c => c.name === 'closePath')).toBe(true)
		expect(calls.filter(c => c.name === 'fill').length).toBeGreaterThanOrEqual(2)
		expect(calls.some(c => c.name === 'stroke')).toBe(true)
	})

	it('skips pattern paint without throwing', () => {
		const { ctx, calls } = createMockContext()
		const patternPaint = {
			type: 'pattern',
			image: {} as CanvasImageSource,
		}
		const shape = {
			...rect({ lineWidth: 2 }),
			fillColor: patternPaint,
			strokeColor: patternPaint,
		} as unknown as WorkerShapeSnapshot

		expect(() => drawWorkerShapes(ctx, [shape], baseOptions)).not.toThrow()

		expect(calls.some(c => c.name === 'fillRect')).toBe(false)
		expect(calls.some(c => c.name === 'strokeRect')).toBe(false)
	})
})
