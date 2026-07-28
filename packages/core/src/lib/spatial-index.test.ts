import { describe, expect, it } from 'vitest'

import { baseShapeToDrawingContext } from './shape-context.utils'
import {
	DEFAULT_SPATIAL_CELL_SIZE,
	UniformGridSpatialIndex,
	resolveSpatialIndexConfig,
} from './spatial-index'
import { RectShape } from '../core/shapes/Rect'
import type { ShapeDrawingContext } from '../model/shape.types'

const rectAt = (x: number, y: number, size = 10, zIndex = 0): ShapeDrawingContext =>
	baseShapeToDrawingContext(
		new RectShape({
			x,
			y,
			width: size,
			height: size,
			fillColor: 'red',
			zIndex,
		}),
	)

const unboundedShape = (zIndex = 0): ShapeDrawingContext => {
	const shape = rectAt(0, 0, 10, zIndex)
	return {
		...shape,
		getLocalBounds: undefined,
	}
}

describe('resolveSpatialIndexConfig', () => {
	it('defaults to enabled with standard cell size and threshold', () => {
		expect(resolveSpatialIndexConfig()).toEqual({
			enabled: true,
			cellSize: DEFAULT_SPATIAL_CELL_SIZE,
			threshold: 64,
		})
	})

	it('disables index when false', () => {
		expect(resolveSpatialIndexConfig(false).enabled).toBe(false)
	})

	it('merges partial config', () => {
		expect(resolveSpatialIndexConfig({ cellSize: 16, threshold: 8 })).toEqual({
			enabled: true,
			cellSize: 16,
			threshold: 8,
		})
	})
})

describe('UniformGridSpatialIndex', () => {
	it('returns only shapes in the queried cell', () => {
		const index = new UniformGridSpatialIndex(32)
		const left = rectAt(0, 0)
		const right = rectAt(100, 0)

		index.rebuild([left, right], shape => {
			const local = shape.getLocalBounds?.()
			return local ? { ...local } : undefined
		})

		const candidates = index.queryCandidates(5, 5)
		expect(candidates.map(shape => shape.id)).toEqual([left.id])

		const farCandidates = index.queryCandidates(105, 5)
		expect(farCandidates.map(shape => shape.id)).toEqual([right.id])
	})

	it('always includes unbounded shapes as candidates', () => {
		const index = new UniformGridSpatialIndex(32)
		const bounded = rectAt(200, 200)
		const unbounded = unboundedShape()

		index.rebuild([bounded, unbounded], shape => {
			const local = shape.getLocalBounds?.()
			return local ? { ...local } : undefined
		})

		const candidates = index.queryCandidates(5, 5)
		expect(candidates.map(shape => shape.id).sort()).toEqual([unbounded.id].sort())

		const farCandidates = index.queryCandidates(205, 205)
		expect(farCandidates.map(shape => shape.id).sort()).toEqual([bounded.id, unbounded.id].sort())
	})

	it('indexes shapes spanning multiple cells', () => {
		const index = new UniformGridSpatialIndex(32)
		const wide = rectAt(0, 0, 80)

		index.rebuild([wide], shape => {
			const local = shape.getLocalBounds?.()
			return local ? { ...local } : undefined
		})

		expect(index.queryCandidates(70, 5).map(shape => shape.id)).toEqual([wide.id])
		expect(index.queryCandidates(5, 5).map(shape => shape.id)).toEqual([wide.id])
	})

	it('clears previous entries on rebuild', () => {
		const index = new UniformGridSpatialIndex(32)
		const first = rectAt(0, 0)
		const second = rectAt(50, 0)

		index.rebuild([first], shape => shape.getLocalBounds?.())
		index.rebuild([second], shape => shape.getLocalBounds?.())

		expect(index.queryCandidates(5, 5)).toEqual([])
		expect(index.queryCandidates(55, 5).map(shape => shape.id)).toEqual([second.id])
	})
})
