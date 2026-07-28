import type { PathCommand } from '../core/shapes/Path'
import { applyDrawEffectsToContext } from '../lib/draw-effects.utils'
import { resolvePaint } from '../lib/paint'
import { unionRectList } from '../lib/rect.utils'
import { applyStrokeStyle } from '../lib/stroke-style'
import { applyTransformsToCtx } from '../lib/transform'
import type { Paint } from '../model/paint.types'
import type { Rect } from '../model/rect.types'
import type { WorkerShapeSnapshot } from './worker.types'

/**
 * 2D-контекст для worker paint: DOM canvas или OffscreenCanvas.
 * Утилиты core типизированы под CanvasRenderingContext2D — каст на границе вызова.
 */
export type Worker2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export type DrawWorkerShapesOptions = {
	dirtyFull: boolean
	dirtyRects: Rect[]
	logicalWidth: number
	logicalHeight: number
}

const asDomCtx = (ctx: Worker2DContext): CanvasRenderingContext2D => ctx as CanvasRenderingContext2D

const isPatternPaint = (paint: unknown): boolean =>
	typeof paint === 'object' &&
	paint !== null &&
	'type' in paint &&
	(paint as { type: string }).type === 'pattern'

/**
 * Резолв paint для snapshot. Pattern в wire не входит — при появлении возвращает null (skip).
 */
const resolveSnapshotPaint = (
	ctx: CanvasRenderingContext2D,
	paint: Paint | unknown,
): string | CanvasGradient | null => {
	if (isPatternPaint(paint)) {
		return null
	}
	return resolvePaint(ctx, paint as Paint) as string | CanvasGradient
}

const strokeMeta = (shape: WorkerShapeSnapshot) => ({
	lineCap: shape.lineCap,
	lineJoin: shape.lineJoin,
	lineDash: shape.lineDash,
	lineDashOffset: shape.lineDashOffset,
})

const applyPathCommand = (ctx: CanvasRenderingContext2D, command: PathCommand): void => {
	switch (command.type) {
		case 'moveTo':
			ctx.moveTo(command.x, command.y)
			break
		case 'lineTo':
			ctx.lineTo(command.x, command.y)
			break
		case 'closePath':
			ctx.closePath()
			break
		case 'bezierCurveTo':
			ctx.bezierCurveTo(
				command.cp1x,
				command.cp1y,
				command.cp2x,
				command.cp2y,
				command.x,
				command.y,
			)
			break
		case 'quadraticCurveTo':
			ctx.quadraticCurveTo(command.cpx, command.cpy, command.x, command.y)
			break
		case 'arc':
			ctx.arc(
				command.x,
				command.y,
				command.radius,
				command.startAngle,
				command.endAngle,
				command.counterclockwise,
			)
			break
		case 'rect':
			ctx.rect(command.x, command.y, command.width, command.height)
			break
		default: {
			const _exhaustive: never = command
			void _exhaustive
		}
	}
}

const fillAndStrokePath = (
	ctx: CanvasRenderingContext2D,
	shape: WorkerShapeSnapshot,
	options: { fillClosedOnly?: boolean; closed?: boolean } = {},
): void => {
	const lineWidth = shape.lineWidth ?? 1
	const canFill = options.fillClosedOnly ? options.closed === true : true

	if (canFill && shape.fillColor) {
		const paint = resolveSnapshotPaint(ctx, shape.fillColor)
		if (paint !== null) {
			ctx.fillStyle = paint
			ctx.fill()
		}
	}

	if (shape.strokeColor && lineWidth > 0) {
		const paint = resolveSnapshotPaint(ctx, shape.strokeColor)
		if (paint !== null) {
			ctx.strokeStyle = paint
			applyStrokeStyle(ctx, { lineWidth, ...strokeMeta(shape) })
			ctx.stroke()
		}
	}
}

const drawShapeGeometry = (ctx: CanvasRenderingContext2D, shape: WorkerShapeSnapshot): void => {
	const lineWidth = shape.lineWidth ?? 1

	switch (shape.kind) {
		case 'rect': {
			if (shape.fillColor) {
				const paint = resolveSnapshotPaint(ctx, shape.fillColor)
				if (paint !== null) {
					ctx.fillStyle = paint
					ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
				}
			}
			if (shape.strokeColor && lineWidth > 0) {
				const paint = resolveSnapshotPaint(ctx, shape.strokeColor)
				if (paint !== null) {
					ctx.strokeStyle = paint
					applyStrokeStyle(ctx, { lineWidth, ...strokeMeta(shape) })
					ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
				}
			}
			return
		}
		case 'circle': {
			ctx.beginPath()
			ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2)
			fillAndStrokePath(ctx, shape)
			return
		}
		case 'ellipse': {
			ctx.beginPath()
			ctx.ellipse(
				shape.cx,
				shape.cy,
				shape.radiusX,
				shape.radiusY,
				shape.rotation ?? 0,
				0,
				Math.PI * 2,
			)
			fillAndStrokePath(ctx, shape)
			return
		}
		case 'line': {
			if (!shape.strokeColor || lineWidth <= 0) return
			const paint = resolveSnapshotPaint(ctx, shape.strokeColor)
			if (paint === null) return
			ctx.beginPath()
			ctx.moveTo(shape.x1, shape.y1)
			ctx.lineTo(shape.x2, shape.y2)
			ctx.strokeStyle = paint
			applyStrokeStyle(ctx, { lineWidth, ...strokeMeta(shape) })
			ctx.stroke()
			return
		}
		case 'polygon': {
			const closed = shape.closed ?? !!shape.fillColor
			if (!shape.points || shape.points.length < (closed ? 3 : 2)) return

			ctx.beginPath()
			ctx.moveTo(shape.points[0].x, shape.points[0].y)
			for (let i = 1; i < shape.points.length; i++) {
				ctx.lineTo(shape.points[i].x, shape.points[i].y)
			}
			if (closed) {
				ctx.closePath()
			}
			fillAndStrokePath(ctx, shape, { fillClosedOnly: true, closed })
			return
		}
		case 'path': {
			if (shape.commands.length === 0) return
			ctx.beginPath()
			for (const command of shape.commands) {
				applyPathCommand(ctx, command)
			}
			fillAndStrokePath(ctx, shape)
			return
		}
		default: {
			const _exhaustive: never = shape
			void _exhaustive
		}
	}
}

const drawOneShape = (ctx: CanvasRenderingContext2D, shape: WorkerShapeSnapshot): void => {
	ctx.save()
	ctx.globalAlpha = shape.opacity
	applyDrawEffectsToContext(ctx, shape)
	if (shape.transforms?.length) {
		applyTransformsToCtx(ctx, shape.transforms)
	}
	drawShapeGeometry(ctx, shape)
	ctx.restore()
}

/**
 * Отрисовка списка WorkerShapeSnapshot на 2d-контекст.
 * Dirty-семантика как у Layer.renderShapesContent: clip+clear региона или полный clear.
 */
export const drawWorkerShapes = (
	ctx: Worker2DContext,
	shapes: WorkerShapeSnapshot[],
	options: DrawWorkerShapesOptions,
): void => {
	const domCtx = asDomCtx(ctx)
	const sorted = shapes.slice().sort((a, b) => a.zIndex - b.zIndex)
	const useRegions = !options.dirtyFull && options.dirtyRects.length > 0
	const region = useRegions ? unionRectList(options.dirtyRects) : undefined

	if (region) {
		domCtx.save()
		domCtx.beginPath()
		domCtx.rect(region.x, region.y, region.width, region.height)
		domCtx.clip()
		domCtx.clearRect(region.x, region.y, region.width, region.height)
		for (const shape of sorted) {
			drawOneShape(domCtx, shape)
		}
		domCtx.restore()
		return
	}

	domCtx.clearRect(0, 0, options.logicalWidth, options.logicalHeight)
	for (const shape of sorted) {
		drawOneShape(domCtx, shape)
	}
}
