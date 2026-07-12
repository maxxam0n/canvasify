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
	distanceToPolyline,
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
		const points: Point[] = []
		let cursor: Point | null = null
		const threshold = Math.max(this.lineWidth, 1) / 2
		const hitStroke = (x1: number, y1: number, x2: number, y2: number) =>
			distanceToSegment(x, y, x1, y1, x2, y2) <= threshold
		const hitPolyline = (polyline: Point[]) =>
			this.strokeColor !== undefined &&
			this.lineWidth > 0 &&
			polyline.length >= 2 &&
			distanceToPolyline(x, y, polyline) <= threshold

		for (const command of this.commands) {
			switch (command.type) {
				case 'moveTo':
					cursor = { x: command.x, y: command.y }
					points.push(cursor)
					break
				case 'lineTo':
					if (cursor && this.strokeColor && hitStroke(cursor.x, cursor.y, command.x, command.y)) {
						return true
					}
					cursor = { x: command.x, y: command.y }
					points.push(cursor)
					break
				case 'bezierCurveTo': {
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
					points.push(...samples)
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'quadraticCurveTo': {
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
					points.push(...samples)
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'arc': {
					const startPt = arcStartPoint(
						command.x,
						command.y,
						command.radius,
						command.startAngle,
					)
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
						if (
							this.strokeColor &&
							hitStroke(cursor.x, cursor.y, startPt.x, startPt.y)
						) {
							return true
						}
						if (hitPolyline([startPt, ...samples])) return true
						points.push(startPt, ...samples)
					} else {
						if (hitPolyline([startPt, ...samples])) return true
						points.push(startPt, ...samples)
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
					break
				}
				case 'closePath':
					if (points.length >= 2 && this.strokeColor) {
						const first = points[0]
						const last = points[points.length - 1]
						if (hitStroke(last.x, last.y, first.x, first.y)) return true
					}
					break
				default:
					break
			}
		}

		if (this.fillColor && points.length >= 3) {
			return pointInPolygon(x, y, points)
		}

		return false
	}

	public getLocalBounds(): Rect | undefined {
		const points: Point[] = []
		let cursor: Point | null = null

		for (const command of this.commands) {
			switch (command.type) {
				case 'moveTo':
				case 'lineTo':
					cursor = { x: command.x, y: command.y }
					points.push(cursor)
					break
				case 'bezierCurveTo': {
					if (cursor) {
						points.push(
							...sampleCubicBezier(
								cursor.x,
								cursor.y,
								command.cp1x,
								command.cp1y,
								command.cp2x,
								command.cp2y,
								command.x,
								command.y,
							),
						)
					}
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'quadraticCurveTo': {
					if (cursor) {
						points.push(
							...sampleQuadraticBezier(
								cursor.x,
								cursor.y,
								command.cpx,
								command.cpy,
								command.x,
								command.y,
							),
						)
					}
					cursor = { x: command.x, y: command.y }
					break
				}
				case 'arc': {
					const startPt = arcStartPoint(
						command.x,
						command.y,
						command.radius,
						command.startAngle,
					)
					points.push(
						startPt,
						...sampleArc(
							command.x,
							command.y,
							command.radius,
							command.startAngle,
							command.endAngle,
							command.counterclockwise,
						),
					)
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
				case 'rect':
					points.push(
						{ x: command.x, y: command.y },
						{ x: command.x + command.width, y: command.y + command.height },
					)
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
