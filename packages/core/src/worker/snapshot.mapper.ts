import { CircleShape } from '../core/shapes/Circle'
import { EllipseShape } from '../core/shapes/Ellipse'
import { ImageShape } from '../core/shapes/Image'
import { LineShape } from '../core/shapes/Line'
import { PathShape, type PathCommand } from '../core/shapes/Path'
import { PolygonShape } from '../core/shapes/Polygon'
import { RectShape } from '../core/shapes/Rect'
import { TextShape } from '../core/shapes/Text'
import type { DrawEffects } from '../model/draw-effects.types'
import type { Paint, PatternPaint } from '../model/paint.types'
import type { BaseShape, ShapeDrawingContext, ShapeParams } from '../model/shape.types'
import type { StrokeStyle } from '../model/stroke.types'
import type { Transform } from '../model/transform.types'
import type { Point } from '../model/types'
import type {
	WorkerSerializablePaint,
	WorkerShapeSnapshot,
	WorkerShapeSnapshotBase,
} from './worker.types'

/** Контекст слоя/сцены, нужный для snapshot (без draw/transform fn). */
export type ShapeToWorkerSnapshotContext = {
	id: string
	shapeParams: ShapeParams
	transforms?: Transform[]
} & DrawEffects

const isPatternPaint = (paint: Paint): paint is PatternPaint =>
	typeof paint === 'object' && paint !== null && paint.type === 'pattern'

const toSerializablePaint = (
	paint: Paint | undefined,
	field: 'fillColor' | 'strokeColor',
): WorkerSerializablePaint | undefined => {
	if (paint === undefined) return undefined
	if (typeof paint === 'string') return paint
	if (isPatternPaint(paint)) {
		throw new Error(
			`PatternPaint is not supported in worker snapshots (field: ${field}). ` +
				'Use a CSS color or linear/radial gradient instead.',
		)
	}
	return paint
}

const readPaint = (
	meta: { [key: string]: unknown },
	field: 'fillColor' | 'strokeColor',
): Paint | undefined => {
	const value = meta[field]
	if (value === undefined) return undefined
	if (typeof value === 'string') return value
	if (typeof value === 'object' && value !== null && 'type' in value) {
		return value as Paint
	}
	throw new Error(`Invalid meta.${field}: expected Paint`)
}

const readOptionalNumber = (meta: { [key: string]: unknown }, key: string): number | undefined => {
	const value = meta[key]
	if (value === undefined) return undefined
	if (typeof value !== 'number' || Number.isNaN(value)) {
		throw new Error(`Invalid meta.${key}: expected number`)
	}
	return value
}

const readNumber = (meta: { [key: string]: unknown }, key: string): number => {
	const value = readOptionalNumber(meta, key)
	if (value === undefined) {
		throw new Error(`Invalid meta.${key}: expected number`)
	}
	return value
}

const readStrokeStyle = (meta: { [key: string]: unknown }): StrokeStyle => {
	const style: StrokeStyle = {}
	const lineCap = meta.lineCap
	if (lineCap === 'butt' || lineCap === 'round' || lineCap === 'square') {
		style.lineCap = lineCap
	}
	const lineJoin = meta.lineJoin
	if (lineJoin === 'round' || lineJoin === 'bevel' || lineJoin === 'miter') {
		style.lineJoin = lineJoin
	}
	if (Array.isArray(meta.lineDash) && meta.lineDash.every(item => typeof item === 'number')) {
		style.lineDash = [...meta.lineDash]
	}
	const lineDashOffset = meta.lineDashOffset
	if (typeof lineDashOffset === 'number') {
		style.lineDashOffset = lineDashOffset
	}
	return style
}

const readPoints = (meta: { [key: string]: unknown }): Point[] => {
	const value = meta.points
	if (!Array.isArray(value)) {
		throw new Error('Invalid meta.points: expected Point[]')
	}
	return value.map((point, index) => {
		if (
			typeof point !== 'object' ||
			point === null ||
			typeof (point as Point).x !== 'number' ||
			typeof (point as Point).y !== 'number'
		) {
			throw new Error(`Invalid meta.points[${index}]: expected { x: number, y: number }`)
		}
		const typed = point as Point
		return { x: typed.x, y: typed.y }
	})
}

const readCommands = (meta: { [key: string]: unknown }): PathCommand[] => {
	const value = meta.commands
	if (!Array.isArray(value)) {
		throw new Error('Invalid meta.commands: expected PathCommand[]')
	}
	return value.map(command => {
		if (typeof command !== 'object' || command === null || !('type' in command)) {
			throw new Error('Invalid meta.commands: expected PathCommand[]')
		}
		return { ...(command as PathCommand) }
	})
}

const buildBase = (
	ctx: ShapeToWorkerSnapshotContext,
	meta: { [key: string]: unknown },
): WorkerShapeSnapshotBase => {
	const fillColor = toSerializablePaint(readPaint(meta, 'fillColor'), 'fillColor')
	const strokeColor = toSerializablePaint(readPaint(meta, 'strokeColor'), 'strokeColor')
	const lineWidth = readOptionalNumber(meta, 'lineWidth')
	const strokeStyle = readStrokeStyle(meta)

	const base: WorkerShapeSnapshotBase = {
		id: ctx.id,
		zIndex: ctx.shapeParams.zIndex,
		opacity: ctx.shapeParams.opacity,
		...strokeStyle,
	}

	if (ctx.transforms !== undefined && ctx.transforms.length > 0) {
		base.transforms = ctx.transforms.map(transform => ({ ...transform }))
	}
	if (ctx.shadowColor !== undefined) base.shadowColor = ctx.shadowColor
	if (ctx.shadowBlur !== undefined) base.shadowBlur = ctx.shadowBlur
	if (ctx.shadowOffsetX !== undefined) base.shadowOffsetX = ctx.shadowOffsetX
	if (ctx.shadowOffsetY !== undefined) base.shadowOffsetY = ctx.shadowOffsetY
	if (ctx.globalCompositeOperation !== undefined) {
		base.globalCompositeOperation = ctx.globalCompositeOperation
	}
	if (fillColor !== undefined) base.fillColor = fillColor
	if (strokeColor !== undefined) base.strokeColor = strokeColor
	if (lineWidth !== undefined) base.lineWidth = lineWidth

	return base
}

/**
 * Маппинг BaseShape → WorkerShapeSnapshot.
 * ImageShape / TextShape / PatternPaint в v1 не поддерживаются.
 */
export const shapeToWorkerSnapshot = (
	shape: BaseShape,
	ctx: ShapeToWorkerSnapshotContext,
): WorkerShapeSnapshot => {
	if (shape instanceof ImageShape) {
		throw new Error(
			'ImageShape is not supported in worker snapshots (v1). ' +
				'Raster images cannot be structured-cloned into the paint worker yet.',
		)
	}
	if (shape instanceof TextShape) {
		throw new Error(
			'TextShape is not supported in worker snapshots (v1). ' +
				'Text layout/fonts are not available in the paint worker yet.',
		)
	}

	const meta = shape.meta
	const base = buildBase(ctx, meta)

	if (shape instanceof RectShape) {
		return {
			...base,
			kind: 'rect',
			x: readNumber(meta, 'x'),
			y: readNumber(meta, 'y'),
			width: readNumber(meta, 'width'),
			height: readNumber(meta, 'height'),
		}
	}

	if (shape instanceof CircleShape) {
		return {
			...base,
			kind: 'circle',
			cx: readNumber(meta, 'cx'),
			cy: readNumber(meta, 'cy'),
			radius: readNumber(meta, 'radius'),
		}
	}

	if (shape instanceof EllipseShape) {
		const rotation = readOptionalNumber(meta, 'rotation')
		return {
			...base,
			kind: 'ellipse',
			cx: readNumber(meta, 'cx'),
			cy: readNumber(meta, 'cy'),
			radiusX: readNumber(meta, 'radiusX'),
			radiusY: readNumber(meta, 'radiusY'),
			...(rotation !== undefined ? { rotation } : {}),
		}
	}

	if (shape instanceof LineShape) {
		return {
			...base,
			kind: 'line',
			x1: readNumber(meta, 'x1'),
			y1: readNumber(meta, 'y1'),
			x2: readNumber(meta, 'x2'),
			y2: readNumber(meta, 'y2'),
		}
	}

	if (shape instanceof PolygonShape) {
		const closed = meta.closed
		return {
			...base,
			kind: 'polygon',
			points: readPoints(meta),
			...(typeof closed === 'boolean' ? { closed } : {}),
		}
	}

	if (shape instanceof PathShape) {
		return {
			...base,
			kind: 'path',
			commands: readCommands(meta),
		}
	}

	throw new Error(
		'Unsupported BaseShape for worker snapshot: expected Rect/Circle/Ellipse/Line/Polygon/Path.',
	)
}

/**
 * Удобный вход: ShapeDrawingContext + опциональный экземпляр фигуры.
 */
export const toWorkerSnapshot = (
	ctx: ShapeDrawingContext,
	shapeHint?: BaseShape,
): WorkerShapeSnapshot => {
	if (!shapeHint) {
		throw new Error(
			'toWorkerSnapshot requires a BaseShape hint (instanceof discrimination). ' +
				'Pass the shape instance or use shapeToWorkerSnapshot / shapesMapToWorkerSnapshots.',
		)
	}
	return shapeToWorkerSnapshot(shapeHint, {
		id: ctx.id,
		shapeParams: ctx.shapeParams,
		transforms: ctx.transforms,
		shadowColor: ctx.shadowColor,
		shadowBlur: ctx.shadowBlur,
		shadowOffsetX: ctx.shadowOffsetX,
		shadowOffsetY: ctx.shadowOffsetY,
		globalCompositeOperation: ctx.globalCompositeOperation,
	})
}

/**
 * Пакетный маппинг Map ShapeDrawingContext → snapshots.
 * `shapeById` обязателен для каждой записи (instanceof по классу фигуры).
 */
export const shapesMapToWorkerSnapshots = (
	shapes: Map<string, ShapeDrawingContext>,
	shapeById?: Map<string, BaseShape>,
): WorkerShapeSnapshot[] => {
	const snapshots: WorkerShapeSnapshot[] = []
	for (const [id, ctx] of shapes) {
		const shape = shapeById?.get(id)
		if (!shape) {
			throw new Error(
				`shapesMapToWorkerSnapshots: missing BaseShape for id "${id}". ` +
					'Keep a Map/WeakMap of BaseShape refs when using worker paint.',
			)
		}
		snapshots.push(
			shapeToWorkerSnapshot(shape, {
				id: ctx.id,
				shapeParams: ctx.shapeParams,
				transforms: ctx.transforms,
				shadowColor: ctx.shadowColor,
				shadowBlur: ctx.shadowBlur,
				shadowOffsetX: ctx.shadowOffsetX,
				shadowOffsetY: ctx.shadowOffsetY,
				globalCompositeOperation: ctx.globalCompositeOperation,
			}),
		)
	}
	return snapshots
}
