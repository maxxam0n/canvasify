import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockCanvas, createMockContext } from '../__tests__/test.utils'
import { Layer, type LayerParams } from '../core/Layer'
import { RectShape } from '../core/shapes/Rect'
import { CircleShape } from '../core/shapes/Circle'
import { baseShapeToDrawingContext } from '../lib/shape-context.utils'
import type { ShapeDrawingContext } from '../model/shape.types'

const createLayer = (params: Pick<LayerParams, 'spatialIndex'> = {}) => {
	const { ctx } = createMockContext()
	const { canvas } = createMockCanvas(ctx)
	return new Layer({ name: 'main', canvas, ...params })
}

const rectShapeAt = (
	x: number,
	y: number,
	options?: {
		width?: number
		height?: number
		zIndex?: number
		listening?: boolean
		id?: string
	},
): ShapeDrawingContext =>
	baseShapeToDrawingContext(
		new RectShape({
			x,
			y,
			width: options?.width ?? 20,
			height: options?.height ?? 20,
			fillColor: 'red',
			zIndex: options?.zIndex ?? 0,
		}),
		{
			id: options?.id,
			listening: options?.listening,
		},
	)

const populateGrid = (layer: Layer, count: number, cellSize = 24) => {
	const shapes: ShapeDrawingContext[] = []
	for (let index = 0; index < count; index += 1) {
		const col = index % 10
		const row = Math.floor(index / 10)
		const shape = rectShapeAt(col * cellSize, row * cellSize, {
			zIndex: index,
			id: `shape-${index}`,
		})
		shapes.push(shape)
		layer.setShape(shape)
	}
	return shapes
}

const sampleHitPoints = (count: number, cellSize = 24) => {
	const points: Array<{ x: number; y: number }> = []
	for (let index = 0; index < count; index += 1) {
		const col = index % 10
		const row = Math.floor(index / 10)
		points.push({
			x: col * cellSize + 10,
			y: row * cellSize + 10,
		})
	}
	points.push({ x: -5, y: -5 }, { x: 999, y: 999 })
	return points
}

describe('Layer.hitTest', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 1 })
	})

	it('returns topmost shape by zIndex', () => {
		const layer = createLayer()

		const bottom = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red', zIndex: 0 }),
		)
		const top = baseShapeToDrawingContext(
			new CircleShape({ cx: 50, cy: 50, radius: 20, fillColor: 'blue', zIndex: 2 }),
		)

		layer.setShape(bottom)
		layer.setShape(top)

		const hit = layer.hitTest(50, 50)
		expect(hit?.shapeId).toBe(top.id)

		const miss = layer.hitTest(90, 90)
		expect(miss?.shapeId).toBe(bottom.id)
	})

	it('applies inverse transforms for hit-test', () => {
		const layer = createLayer()

		const shape = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 20, height: 20, fillColor: 'red' }),
			{ transforms: [{ type: 'translate', translateX: 100, translateY: 50 }] },
		)
		layer.setShape(shape)

		expect(layer.hitTest(110, 60)?.shapeId).toBe(shape.id)
		expect(layer.hitTest(10, 10)).toBeUndefined()
	})

	it('respects clip-rect transforms', () => {
		const layer = createLayer()

		const shape = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' }),
			{ transforms: [{ type: 'clip-rect', x: 0, y: 0, width: 30, height: 30 }] },
		)
		layer.setShape(shape)

		expect(layer.hitTest(10, 10)?.shapeId).toBe(shape.id)
		expect(layer.hitTest(50, 50)).toBeUndefined()
	})

	it('skips shapes with listening === false', () => {
		const layer = createLayer()

		const nonListening = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 40, height: 40, fillColor: 'red', zIndex: 2 }),
			{ listening: false },
		)
		const listening = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 100, height: 100, fillColor: 'blue', zIndex: 0 }),
			{ listening: true },
		)

		layer.setShape(listening)
		layer.setShape(nonListening)

		expect(layer.hitTest(20, 20)?.shapeId).toBe(listening.id)
		expect(layer.hitTest(80, 80)?.shapeId).toBe(listening.id)
	})

	it('treats undefined listening as hittable', () => {
		const layer = createLayer()

		const shape = baseShapeToDrawingContext(
			new RectShape({ x: 0, y: 0, width: 40, height: 40, fillColor: 'red' }),
		)
		layer.setShape(shape)

		expect(layer.hitTest(20, 20)?.shapeId).toBe(shape.id)
	})

	it('keeps zero-opacity shapes hittable', () => {
		const layer = createLayer()

		const shape = baseShapeToDrawingContext(
			new RectShape({
				x: 0,
				y: 0,
				width: 40,
				height: 40,
				fillColor: 'red',
				opacity: 0,
			}),
		)
		layer.setShape(shape)

		expect(layer.hitTest(20, 20)?.shapeId).toBe(shape.id)
	})

	describe('spatial index', () => {
		const spatialOptions = { cellSize: 32, threshold: 8 } as const

		it('matches linear scan for dense mixed scenes', () => {
			const linearLayer = createLayer({ spatialIndex: false })
			const spatialLayer = createLayer({ spatialIndex: spatialOptions })

			const shapeCount = 24
			populateGrid(linearLayer, shapeCount)
			populateGrid(spatialLayer, shapeCount)

			const overlappingTop = baseShapeToDrawingContext(
				new CircleShape({ cx: 12, cy: 12, radius: 30, fillColor: 'blue', zIndex: 100 }),
			)
			linearLayer.setShape(overlappingTop)
			spatialLayer.setShape(overlappingTop)

			for (const point of sampleHitPoints(shapeCount)) {
				expect(spatialLayer.hitTest(point.x, point.y)).toEqual(
					linearLayer.hitTest(point.x, point.y),
				)
			}
		})

		it('preserves z-order among overlapping shapes with spatial index enabled', () => {
			const layer = createLayer({ spatialIndex: spatialOptions })

			const bottom = rectShapeAt(0, 0, { zIndex: 0, id: 'bottom' })
			const middle = rectShapeAt(5, 5, { zIndex: 5, id: 'middle' })
			const top = rectShapeAt(10, 10, { zIndex: 10, id: 'top' })

			layer.setShape(bottom)
			layer.setShape(middle)
			layer.setShape(top)

			for (let index = 0; index < 8; index += 1) {
				layer.setShape(rectShapeAt(200 + index * 24, 0, { zIndex: index + 20, id: `filler-${index}` }))
			}

			expect(layer.hitTest(15, 15)?.shapeId).toBe(top.id)
		})

		it('skips non-listening shapes when spatial index is active', () => {
			const layer = createLayer({ spatialIndex: spatialOptions })

			const listening = rectShapeAt(0, 0, { zIndex: 0, listening: true, id: 'listening' })
			const nonListening = rectShapeAt(0, 0, { zIndex: 50, listening: false, id: 'silent' })

			layer.setShape(listening)
			layer.setShape(nonListening)

			for (let index = 0; index < 8; index += 1) {
				layer.setShape(rectShapeAt(200 + index * 24, 0, { zIndex: index + 1, id: `filler-${index}` }))
			}

			expect(layer.hitTest(10, 10)?.shapeId).toBe(listening.id)
		})

		it('includes shapes without bounds in spatial candidates', () => {
			const layer = createLayer({ spatialIndex: spatialOptions })

			const bounded = rectShapeAt(100, 100, { zIndex: 0, id: 'bounded' })
			const unbounded = {
				...rectShapeAt(0, 0, { zIndex: 5, id: 'unbounded' }),
				getLocalBounds: undefined,
			}

			layer.setShape(bounded)
			layer.setShape(unbounded)

			for (let index = 0; index < 8; index += 1) {
				layer.setShape(rectShapeAt(200 + index * 24, 50, { zIndex: index + 10, id: `filler-${index}` }))
			}

			expect(layer.hitTest(10, 10)?.shapeId).toBe(unbounded.id)
			expect(layer.hitTest(110, 110)?.shapeId).toBe(bounded.id)
		})

		it('falls back to linear scan below threshold', () => {
			const layer = createLayer({ spatialIndex: spatialOptions })

			const only = rectShapeAt(0, 0, { zIndex: 0, id: 'only' })
			layer.setShape(only)

			expect(layer.hitTest(10, 10)?.shapeId).toBe(only.id)
		})
	})
})
