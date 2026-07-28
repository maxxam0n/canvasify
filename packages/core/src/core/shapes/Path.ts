import type { BaseShape, ShapeParams } from '../../model/shape.types'
import type { Paint } from '../../model/paint.types'
import type { Rect } from '../../model/rect.types'
import type { StrokeStyle } from '../../model/stroke.types'
import { resolvePaint } from '../../lib/paint'
import { pointInPolygon, pointInRect, distanceToSegment } from '../../lib/hit-test.utils'
import { applyStrokeStyle, pickStrokeStyleMeta } from '../../lib/stroke-style'
import {
	arcEndPoint,
	arcStartPoint,
	cubicBezierPoint,
	distanceToPolyline,
	normalizeArcSweep,
	quadraticBezierPoint,
	sampleArc,
	sampleCubicBezier,
	sampleQuadraticBezier,
} from '../../lib/path-geometry.utils'
import { aabbFromPoints } from '../../lib/rect.utils'
import type { Point } from '../../model/types'

/**
 * Команда построения пути (подмножество Canvas path API).
 */
export type PathCommand =
	| { type: 'moveTo'; x: number; y: number }
	| { type: 'lineTo'; x: number; y: number }
	| { type: 'closePath' }
	| {
			type: 'bezierCurveTo'
			cp1x: number
			cp1y: number
			cp2x: number
			cp2y: number
			x: number
			y: number
	  }
	| {
			type: 'quadraticCurveTo'
			cpx: number
			cpy: number
			x: number
			y: number
	  }
	| {
			type: 'arc'
			x: number
			y: number
			radius: number
			startAngle: number
			endAngle: number
			counterclockwise?: boolean
	  }
	| {
			type: 'rect'
			x: number
			y: number
			width: number
			height: number
	  }

/**
 * Parameters for creating a path shape.
 */
export interface PathParams extends StrokeStyle {
	/** Последовательность команд пути. */
	commands: PathCommand[]
	/** Opacity value between 0 (transparent) and 1 (opaque). Defaults to 1. */
	opacity?: number
	/** Fill paint (CSS color or gradient). */
	fillColor?: Paint
	/** Stroke paint (CSS color or gradient). */
	strokeColor?: Paint
	/** Width of the stroke in pixels. Defaults to 1. */
	lineWidth?: number
	/** The z-index for rendering order. Higher values are rendered on top. Defaults to 0. */
	zIndex?: number
}

type ArcCommand = Extract<PathCommand, { type: 'arc' }>
type CubicBezierCommand = Extract<PathCommand, { type: 'bezierCurveTo' }>
type QuadraticBezierCommand = Extract<PathCommand, { type: 'quadraticCurveTo' }>

const TAU = Math.PI * 2
const ROOT_EPSILON_FACTOR = 16
const CARDINAL_DIRECTIONS = [
	{ angle: 0, x: 1, y: 0 },
	{ angle: Math.PI / 2, x: 0, y: 1 },
	{ angle: Math.PI, x: -1, y: 0 },
	{ angle: (Math.PI * 3) / 2, x: 0, y: -1 },
] as const

const positiveModulo = (value: number, divisor: number): number =>
	((value % divisor) + divisor) % divisor

const isAngleOnArc = (
	angle: number,
	startAngle: number,
	endAngle: number,
	counterclockwise: boolean,
): boolean => {
	const sweep = Math.abs(endAngle - startAngle)
	if (sweep >= TAU) return true

	const directedDistance = positiveModulo(
		counterclockwise ? startAngle - angle : angle - startAngle,
		TAU,
	)
	return directedDistance <= sweep
}

const getArcBoundsPoints = (command: ArcCommand): Point[] => {
	const counterclockwise = command.counterclockwise ?? false
	const { start, end } = normalizeArcSweep(command.startAngle, command.endAngle, counterclockwise)
	const points = [
		arcStartPoint(command.x, command.y, command.radius, start),
		arcEndPoint(
			command.x,
			command.y,
			command.radius,
			command.startAngle,
			command.endAngle,
			counterclockwise,
		),
	]

	for (const direction of CARDINAL_DIRECTIONS) {
		if (!isAngleOnArc(direction.angle, start, end, counterclockwise)) continue
		points.push({
			x: command.x + command.radius * direction.x,
			y: command.y + command.radius * direction.y,
		})
	}

	return points
}

const solveQuadraticEquation = (a: number, b: number, c: number): number[] => {
	const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c))
	if (scale === 0) return []

	const normalizedA = a / scale
	const normalizedB = b / scale
	const normalizedC = c / scale
	const tolerance = Number.EPSILON * ROOT_EPSILON_FACTOR
	if (Math.abs(normalizedA) <= tolerance) {
		return Math.abs(normalizedB) <= tolerance ? [] : [-normalizedC / normalizedB]
	}

	const discriminant = normalizedB * normalizedB - 4 * normalizedA * normalizedC
	const discriminantTolerance =
		Number.EPSILON *
		(normalizedB * normalizedB + Math.abs(4 * normalizedA * normalizedC)) *
		ROOT_EPSILON_FACTOR
	if (discriminant < -discriminantTolerance) return []
	if (Math.abs(discriminant) <= discriminantTolerance) {
		return [-normalizedB / (2 * normalizedA)]
	}

	const squareRoot = Math.sqrt(discriminant)
	const stableNumerator = -0.5 * (normalizedB + Math.sign(normalizedB || 1) * squareRoot)
	return [stableNumerator / normalizedA, normalizedC / stableNumerator]
}

const getQuadraticExtremum = (start: number, control: number, end: number): number[] => {
	const firstDifference = control - start
	const secondDifference = end - control
	const denominator = secondDifference - firstDifference
	const scale = Math.max(Math.abs(firstDifference), Math.abs(secondDifference))
	const tolerance = Number.EPSILON * scale * ROOT_EPSILON_FACTOR
	return Math.abs(denominator) <= tolerance ? [] : [-firstDifference / denominator]
}

const getCubicExtrema = (
	start: number,
	firstControl: number,
	secondControl: number,
	end: number,
): number[] => {
	const firstDifference = firstControl - start
	const secondDifference = secondControl - firstControl
	const thirdDifference = end - secondControl
	return solveQuadraticEquation(
		firstDifference - 2 * secondDifference + thirdDifference,
		2 * (secondDifference - firstDifference),
		firstDifference,
	)
}

const uniqueInteriorParameters = (parameters: number[]): number[] => [
	...new Set(parameters.filter(parameter => parameter > 0 && parameter < 1)),
]

const getQuadraticBezierBoundsPoints = (start: Point, command: QuadraticBezierCommand): Point[] => {
	const parameters = uniqueInteriorParameters([
		...getQuadraticExtremum(start.x, command.cpx, command.x),
		...getQuadraticExtremum(start.y, command.cpy, command.y),
	])
	return [
		start,
		{ x: command.x, y: command.y },
		...parameters.map(parameter =>
			quadraticBezierPoint(
				start.x,
				start.y,
				command.cpx,
				command.cpy,
				command.x,
				command.y,
				parameter,
			),
		),
	]
}

const getCubicBezierBoundsPoints = (start: Point, command: CubicBezierCommand): Point[] => {
	const parameters = uniqueInteriorParameters([
		...getCubicExtrema(start.x, command.cp1x, command.cp2x, command.x),
		...getCubicExtrema(start.y, command.cp1y, command.cp2y, command.y),
	])
	return [
		start,
		{ x: command.x, y: command.y },
		...parameters.map(parameter =>
			cubicBezierPoint(
				start.x,
				start.y,
				command.cp1x,
				command.cp1y,
				command.cp2x,
				command.cp2y,
				command.x,
				command.y,
				parameter,
			),
		),
	]
}

const applyCommand = (target: CanvasRenderingContext2D | Path2D, command: PathCommand) => {
	switch (command.type) {
		case 'moveTo':
			target.moveTo(command.x, command.y)
			break
		case 'lineTo':
			target.lineTo(command.x, command.y)
			break
		case 'closePath':
			target.closePath()
			break
		case 'bezierCurveTo':
			target.bezierCurveTo(
				command.cp1x,
				command.cp1y,
				command.cp2x,
				command.cp2y,
				command.x,
				command.y,
			)
			break
		case 'quadraticCurveTo':
			target.quadraticCurveTo(command.cpx, command.cpy, command.x, command.y)
			break
		case 'arc':
			target.arc(
				command.x,
				command.y,
				command.radius,
				command.startAngle,
				command.endAngle,
				command.counterclockwise,
			)
			break
		case 'rect':
			target.rect(command.x, command.y, command.width, command.height)
			break
	}
}

export class PathShape implements BaseShape {
	private commands: PathCommand[]
	private opacity: number
	private fillColor?: Paint
	private strokeColor?: Paint
	private lineWidth: number
	private lineCap?: CanvasLineCap
	private lineJoin?: CanvasLineJoin
	private lineDash?: number[]
	private lineDashOffset?: number
	private zIndex: number

	constructor({
		commands,
		opacity = 1,
		fillColor,
		strokeColor,
		lineWidth = 1,
		lineCap,
		lineJoin,
		lineDash,
		lineDashOffset,
		zIndex = 0,
	}: PathParams) {
		this.commands = commands
		this.opacity = opacity
		this.fillColor = fillColor
		this.strokeColor = strokeColor
		this.lineWidth = lineWidth
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.lineDash = lineDash
		this.lineDashOffset = lineDashOffset
		this.zIndex = zIndex
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (this.commands.length === 0) return

		ctx.beginPath()
		for (const command of this.commands) {
			applyCommand(ctx, command)
		}

		if (this.fillColor) {
			ctx.fillStyle = resolvePaint(ctx, this.fillColor)
			ctx.fill()
		}

		if (this.strokeColor && this.lineWidth > 0) {
			ctx.strokeStyle = resolvePaint(ctx, this.strokeColor)
			applyStrokeStyle(ctx, {
				lineWidth: this.lineWidth,
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			})
			ctx.stroke()
		}
	}

	public contains(x: number, y: number): boolean {
		if (typeof Path2D !== 'undefined' && typeof document !== 'undefined') {
			const path = new Path2D()
			for (const command of this.commands) {
				applyCommand(path, command)
			}

			const canvas = document.createElement('canvas')
			const ctx = canvas.getContext('2d')
			if (ctx) {
				if (this.fillColor && ctx.isPointInPath(path, x, y)) return true
				if (this.strokeColor && this.lineWidth > 0) {
					ctx.lineWidth = this.lineWidth
					if (typeof ctx.isPointInStroke === 'function' && ctx.isPointInStroke(path, x, y)) {
						return true
					}
				}
			}
		}

		return this.containsViaSegments(x, y)
	}

	/** Упрощённый hit-test по отрезкам/кривым-полилиниям без Path2D. */
	private containsViaSegments(x: number, y: number): boolean {
		const subpaths: Point[][] = []
		let currentSubpath: Point[] | null = null
		let subpathStart: Point | null = null
		let cursor: Point | null = null
		const getCursor = (): Point | null => cursor
		const getSubpathStart = (): Point | null => subpathStart
		const threshold = Math.max(this.lineWidth, 1) / 2
		const hitStroke = (x1: number, y1: number, x2: number, y2: number) =>
			distanceToSegment(x, y, x1, y1, x2, y2) <= threshold
		const hitPolyline = (polyline: Point[]) =>
			this.strokeColor !== undefined &&
			this.lineWidth > 0 &&
			polyline.length >= 2 &&
			distanceToPolyline(x, y, polyline) <= threshold

		const beginSubpath = (point: Point): void => {
			currentSubpath = [point]
			subpaths.push(currentSubpath)
			subpathStart = point
			cursor = point
		}

		const appendToSubpath = (points: Point[]): void => {
			if (!currentSubpath) {
				const [firstPoint, ...remainingPoints] = points
				if (!firstPoint) return
				const nextSubpath = [firstPoint, ...remainingPoints]
				currentSubpath = nextSubpath
				subpaths.push(nextSubpath)
				subpathStart = firstPoint
				cursor = nextSubpath.at(-1) ?? firstPoint
				return
			}
			currentSubpath.push(...points)
		}

		for (const command of this.commands) {
			switch (command.type) {
				case 'moveTo': {
					beginSubpath({ x: command.x, y: command.y })
					break
				}
				case 'lineTo': {
					const endPoint = { x: command.x, y: command.y }
					if (!cursor) {
						beginSubpath(endPoint)
						break
					}
					if (this.strokeColor && hitStroke(cursor.x, cursor.y, endPoint.x, endPoint.y)) {
						return true
					}
					appendToSubpath([endPoint])
					cursor = endPoint
					break
				}
				case 'bezierCurveTo': {
					if (!cursor) {
						beginSubpath({ x: command.cp1x, y: command.cp1y })
					}
					if (!cursor) break
					const samples = sampleCubicBezier(
						cursor.x,
						cursor.y,
						command.cp1x,
						command.cp1y,
						command.cp2x,
						command.cp2y,
						command.x,
						command.y,
					)
					if (hitPolyline([cursor, ...samples])) return true
					appendToSubpath(samples)
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'quadraticCurveTo': {
					if (!cursor) {
						beginSubpath({ x: command.cpx, y: command.cpy })
					}
					if (!cursor) break
					const samples = sampleQuadraticBezier(
						cursor.x,
						cursor.y,
						command.cpx,
						command.cpy,
						command.x,
						command.y,
					)
					if (hitPolyline([cursor, ...samples])) return true
					appendToSubpath(samples)
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'arc': {
					const startPt = arcStartPoint(command.x, command.y, command.radius, command.startAngle)
					const endPt = arcEndPoint(
						command.x,
						command.y,
						command.radius,
						command.startAngle,
						command.endAngle,
						command.counterclockwise,
					)
					const samples = sampleArc(
						command.x,
						command.y,
						command.radius,
						command.startAngle,
						command.endAngle,
						command.counterclockwise,
					)
					if (cursor) {
						if (this.strokeColor && hitStroke(cursor.x, cursor.y, startPt.x, startPt.y)) {
							return true
						}
						if (hitPolyline([startPt, ...samples])) return true
						appendToSubpath([startPt, ...samples])
					} else {
						if (hitPolyline([startPt, ...samples])) return true
						beginSubpath(startPt)
						appendToSubpath(samples)
					}
					cursor = endPt
					break
				}
				case 'rect': {
					const rect = {
						x: command.x,
						y: command.y,
						width: command.width,
						height: command.height,
					}
					if (this.fillColor && pointInRect(x, y, rect)) return true
					if (this.strokeColor && this.lineWidth > 0) {
						const x0 = command.x
						const y0 = command.y
						const x1 = command.x + command.width
						const y1 = command.y + command.height
						if (
							hitStroke(x0, y0, x1, y0) ||
							hitStroke(x1, y0, x1, y1) ||
							hitStroke(x1, y1, x0, y1) ||
							hitStroke(x0, y1, x0, y0)
						) {
							return true
						}
					}
					const startPoint = { x: command.x, y: command.y }
					subpaths.push([
						startPoint,
						{ x: command.x + command.width, y: command.y },
						{ x: command.x + command.width, y: command.y + command.height },
						{ x: command.x, y: command.y + command.height },
					])
					beginSubpath(startPoint)
					break
				}
				case 'closePath': {
					const currentPoint = getCursor()
					const startPoint = getSubpathStart()
					if (currentPoint && startPoint && this.strokeColor) {
						if (hitStroke(currentPoint.x, currentPoint.y, startPoint.x, startPoint.y)) {
							return true
						}
					}
					if (startPoint) {
						beginSubpath(startPoint)
					}
					break
				}
				default:
					break
			}
		}

		if (this.fillColor) {
			return subpaths.some(points => points.length >= 3 && pointInPolygon(x, y, points))
		}

		return false
	}

	public getLocalBounds(): Rect | undefined {
		const points: Point[] = []
		let cursor: Point | null = null
		let subpathStart: Point | null = null

		for (const command of this.commands) {
			switch (command.type) {
				case 'moveTo':
					cursor = { x: command.x, y: command.y }
					subpathStart = cursor
					points.push(cursor)
					break
				case 'lineTo':
					cursor = { x: command.x, y: command.y }
					if (!subpathStart) {
						subpathStart = cursor
					}
					points.push(cursor)
					break
				case 'bezierCurveTo': {
					if (!cursor) {
						cursor = { x: command.cp1x, y: command.cp1y }
						subpathStart = cursor
					}
					points.push(...getCubicBezierBoundsPoints(cursor, command))
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'quadraticCurveTo': {
					if (!cursor) {
						cursor = { x: command.cpx, y: command.cpy }
						subpathStart = cursor
					}
					points.push(...getQuadraticBezierBoundsPoints(cursor, command))
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'arc': {
					const arcStart = arcStartPoint(command.x, command.y, command.radius, command.startAngle)
					if (!cursor) {
						subpathStart = arcStart
					}
					points.push(...getArcBoundsPoints(command))
					cursor = arcEndPoint(
						command.x,
						command.y,
						command.radius,
						command.startAngle,
						command.endAngle,
						command.counterclockwise,
					)
					break
				}
				case 'rect': {
					const startPoint = { x: command.x, y: command.y }
					points.push(startPoint, { x: command.x + command.width, y: command.y + command.height })
					cursor = startPoint
					subpathStart = startPoint
					break
				}
				case 'closePath':
					if (subpathStart) {
						cursor = subpathStart
					}
					break
				default:
					break
			}
		}

		if (points.length === 0) return undefined

		const pad = this.strokeColor && this.lineWidth > 0 ? this.lineWidth / 2 : 0
		const bounds = aabbFromPoints(points)
		return {
			x: bounds.x - pad,
			y: bounds.y - pad,
			width: bounds.width + pad * 2,
			height: bounds.height + pad * 2,
		}
	}

	public get shapeParams(): ShapeParams {
		return { zIndex: this.zIndex, opacity: this.opacity }
	}

	public get meta(): { [key: string]: unknown } {
		return {
			commands: this.commands,
			fillColor: this.fillColor,
			strokeColor: this.strokeColor,
			lineWidth: this.lineWidth,
			...pickStrokeStyleMeta({
				lineCap: this.lineCap,
				lineJoin: this.lineJoin,
				lineDash: this.lineDash,
				lineDashOffset: this.lineDashOffset,
			}),
		}
	}
}
