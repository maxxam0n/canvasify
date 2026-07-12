import { describe, expect, it, vi } from 'vitest'

import { CircleShape } from '../core/shapes/Circle'
import { EllipseShape } from '../core/shapes/Ellipse'
import { ImageShape } from '../core/shapes/Image'
import { LineShape } from '../core/shapes/Line'
import { PathShape } from '../core/shapes/Path'
import { PolygonShape } from '../core/shapes/Polygon'
import { RectShape } from '../core/shapes/Rect'
import { TextShape } from '../core/shapes/Text'
import { baseShapeToDrawingContext } from '../lib/shape-context.utils'
import type { PatternPaint } from '../model/paint.types'
import type { BaseShape, ShapeDrawingContext } from '../model/shape.types'
import {
	shapeToWorkerSnapshot,
	shapesMapToWorkerSnapshots,
	toWorkerSnapshot,
} from './snapshot.mapper'

const baseCtx = (id: string, shapeParams = { zIndex: 0, opacity: 1 }) => ({
	id,
	shapeParams,
})

class MockImage {
	public onload: (() => void) | null = null
	public onerror: (() => void) | null = null
	public naturalWidth = 1
	public naturalHeight = 1
	private _src = ''

	public set src(value: string) {
		this._src = value
		this.onload?.()
	}

	public get src() {
		return this._src
	}
}

describe('shapeToWorkerSnapshot', () => {
	it('maps RectShape', () => {
		const shape = new RectShape({
			x: 1,
			y: 2,
			width: 30,
			height: 40,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 3,
			lineCap: 'round',
			zIndex: 5,
			opacity: 0.7,
		})

		expect(
			shapeToWorkerSnapshot(shape, {
				...baseCtx('rect-1', { zIndex: 5, opacity: 0.7 }),
				transforms: [{ type: 'translate', translateX: 10, translateY: 20 }],
				shadowBlur: 4,
			}),
		).toEqual({
			kind: 'rect',
			id: 'rect-1',
			zIndex: 5,
			opacity: 0.7,
			x: 1,
			y: 2,
			width: 30,
			height: 40,
			fillColor: '#111',
			strokeColor: '#222',
			lineWidth: 3,
			lineCap: 'round',
			transforms: [{ type: 'translate', translateX: 10, translateY: 20 }],
			shadowBlur: 4,
		})
	})

	it('maps CircleShape', () => {
		const shape = new CircleShape({
			cx: 50,
			cy: 60,
			radius: 15,
			fillColor: {
				type: 'linear-gradient',
				x0: 0,
				y0: 0,
				x1: 10,
				y1: 10,
				stops: [
					{ offset: 0, color: 'red' },
					{ offset: 1, color: 'blue' },
				],
			},
		})

		expect(shapeToWorkerSnapshot(shape, baseCtx('circle-1'))).toEqual({
			kind: 'circle',
			id: 'circle-1',
			zIndex: 0,
			opacity: 1,
			cx: 50,
			cy: 60,
			radius: 15,
			fillColor: {
				type: 'linear-gradient',
				x0: 0,
				y0: 0,
				x1: 10,
				y1: 10,
				stops: [
					{ offset: 0, color: 'red' },
					{ offset: 1, color: 'blue' },
				],
			},
			lineWidth: 1,
		})
	})

	it('maps EllipseShape', () => {
		const shape = new EllipseShape({
			cx: 8,
			cy: 9,
			radiusX: 12,
			radiusY: 6,
			rotation: Math.PI / 4,
			strokeColor: {
				type: 'radial-gradient',
				x0: 0,
				y0: 0,
				r0: 0,
				x1: 0,
				y1: 0,
				r1: 10,
				stops: [{ offset: 0, color: '#fff' }],
			},
			lineWidth: 2,
		})

		expect(shapeToWorkerSnapshot(shape, baseCtx('ellipse-1'))).toEqual({
			kind: 'ellipse',
			id: 'ellipse-1',
			zIndex: 0,
			opacity: 1,
			cx: 8,
			cy: 9,
			radiusX: 12,
			radiusY: 6,
			rotation: Math.PI / 4,
			strokeColor: {
				type: 'radial-gradient',
				x0: 0,
				y0: 0,
				r0: 0,
				x1: 0,
				y1: 0,
				r1: 10,
				stops: [{ offset: 0, color: '#fff' }],
			},
			lineWidth: 2,
		})
	})

	it('maps LineShape', () => {
		const shape = new LineShape({
			x1: 0,
			y1: 0,
			x2: 100,
			y2: 50,
			strokeColor: '#000',
			lineWidth: 4,
			lineDash: [2, 4],
		})

		expect(shapeToWorkerSnapshot(shape, baseCtx('line-1'))).toEqual({
			kind: 'line',
			id: 'line-1',
			zIndex: 0,
			opacity: 1,
			x1: 0,
			y1: 0,
			x2: 100,
			y2: 50,
			strokeColor: '#000',
			lineWidth: 4,
			lineDash: [2, 4],
		})
	})

	it('maps PolygonShape', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 5, y: 8 },
		]
		const shape = new PolygonShape({
			points,
			closed: true,
			fillColor: '#abc',
		})

		const snapshot = shapeToWorkerSnapshot(shape, baseCtx('poly-1'))
		expect(snapshot).toEqual({
			kind: 'polygon',
			id: 'poly-1',
			zIndex: 0,
			opacity: 1,
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 5, y: 8 },
			],
			closed: true,
			fillColor: '#abc',
			lineWidth: 1,
		})
		if (snapshot.kind === 'polygon') {
			expect(snapshot.points).not.toBe(points)
		}
	})

	it('maps PathShape', () => {
		const commands = [
			{ type: 'moveTo' as const, x: 0, y: 0 },
			{ type: 'lineTo' as const, x: 10, y: 10 },
			{ type: 'closePath' as const },
		]
		const shape = new PathShape({
			commands,
			strokeColor: '#333',
			lineWidth: 1,
		})

		const snapshot = shapeToWorkerSnapshot(shape, baseCtx('path-1'))
		expect(snapshot).toEqual({
			kind: 'path',
			id: 'path-1',
			zIndex: 0,
			opacity: 1,
			commands: [
				{ type: 'moveTo', x: 0, y: 0 },
				{ type: 'lineTo', x: 10, y: 10 },
				{ type: 'closePath' },
			],
			strokeColor: '#333',
			lineWidth: 1,
		})
		if (snapshot.kind === 'path') {
			expect(snapshot.commands).not.toBe(commands)
		}
	})

	it('throws for ImageShape', () => {
		vi.stubGlobal('Image', MockImage)
		const shape = new ImageShape({ src: '/x.png' })
		expect(() => shapeToWorkerSnapshot(shape, baseCtx('img-1'))).toThrow(
			/ImageShape is not supported/,
		)
		vi.unstubAllGlobals()
	})

	it('throws for TextShape', () => {
		const shape = new TextShape({ text: 'hello', fillColor: '#000' })
		expect(() => shapeToWorkerSnapshot(shape, baseCtx('text-1'))).toThrow(
			/TextShape is not supported/,
		)
	})

	it('throws for PatternPaint in fillColor', () => {
		const pattern: PatternPaint = {
			type: 'pattern',
			image: {} as CanvasImageSource,
		}
		const shape = new RectShape({
			width: 10,
			height: 10,
			fillColor: pattern,
		})
		expect(() => shapeToWorkerSnapshot(shape, baseCtx('pattern-fill'))).toThrow(
			/PatternPaint is not supported.*fillColor/,
		)
	})

	it('throws for PatternPaint in strokeColor', () => {
		const pattern: PatternPaint = {
			type: 'pattern',
			image: {} as CanvasImageSource,
			repetition: 'repeat',
		}
		const shape = new CircleShape({
			radius: 5,
			strokeColor: pattern,
		})
		expect(() => shapeToWorkerSnapshot(shape, baseCtx('pattern-stroke'))).toThrow(
			/PatternPaint is not supported.*strokeColor/,
		)
	})

	it('throws for unknown BaseShape', () => {
		const fake = {
			draw: () => undefined,
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
		}
		expect(() => shapeToWorkerSnapshot(fake, baseCtx('unknown'))).toThrow(
			/Unsupported BaseShape/,
		)
	})
})

describe('toWorkerSnapshot', () => {
	it('maps via ShapeDrawingContext + shape hint', () => {
		const shape = new RectShape({ x: 0, y: 0, width: 5, height: 5, fillColor: 'red' })
		const ctx = baseShapeToDrawingContext(shape, {
			id: 'from-ctx',
			shadowColor: 'rgba(0,0,0,0.2)',
		})
		expect(toWorkerSnapshot(ctx, shape)).toMatchObject({
			kind: 'rect',
			id: 'from-ctx',
			fillColor: 'red',
			shadowColor: 'rgba(0,0,0,0.2)',
		})
	})

	it('throws without shape hint', () => {
		const ctx = {
			id: 'x',
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			draw: () => undefined,
			transform: () => undefined,
		} satisfies ShapeDrawingContext
		expect(() => toWorkerSnapshot(ctx)).toThrow(/requires a BaseShape hint/)
	})
})

describe('shapesMapToWorkerSnapshots', () => {
	it('maps each entry using shapeById', () => {
		const rect = new RectShape({ width: 10, height: 10, fillColor: '#f00' })
		const circle = new CircleShape({ radius: 4, fillColor: '#0f0' })
		const rectCtx = baseShapeToDrawingContext(rect, { id: 'r' })
		const circleCtx = baseShapeToDrawingContext(circle, { id: 'c', shapeParams: { zIndex: 2 } })

		const shapes = new Map<string, ShapeDrawingContext>([
			['r', rectCtx],
			['c', circleCtx],
		])
		const shapeById = new Map<string, BaseShape>([
			['r', rect],
			['c', circle],
		])

		expect(shapesMapToWorkerSnapshots(shapes, shapeById)).toEqual([
			expect.objectContaining({ kind: 'rect', id: 'r', width: 10, height: 10 }),
			expect.objectContaining({ kind: 'circle', id: 'c', radius: 4, zIndex: 2 }),
		])
	})

	it('throws when BaseShape is missing for an id', () => {
		const rect = new RectShape({ width: 1, height: 1 })
		const ctx = baseShapeToDrawingContext(rect, { id: 'missing-ref' })
		const shapes = new Map([['missing-ref', ctx]])

		expect(() => shapesMapToWorkerSnapshots(shapes, new Map())).toThrow(
			/missing BaseShape for id "missing-ref"/,
		)
		expect(() => shapesMapToWorkerSnapshots(shapes)).toThrow(
			/missing BaseShape for id "missing-ref"/,
		)
	})
})
