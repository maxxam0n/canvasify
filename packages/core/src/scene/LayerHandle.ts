import { baseShapeToDrawingContext } from '../lib/shape-context.utils'
import type { Layer } from '../core/Layer'
import type { GroupParams } from '../model/types'
import type { LayerHandle } from './scene.types'
import type { Transform } from '../model/transform.types'
import { CircleShape } from '../core/shapes/Circle'
import { EllipseShape } from '../core/shapes/Ellipse'
import { ImageShape } from '../core/shapes/Image'
import { LineShape } from '../core/shapes/Line'
import { PolygonShape } from '../core/shapes/Polygon'
import { RectShape } from '../core/shapes/Rect'
import { TextShape } from '../core/shapes/Text'

export function createLayerHandle(layer: Layer): LayerHandle {
	const transformsStack: Transform[][] = []
	const groupParamsStack: GroupParams[] = []

	function getCurrentTransforms(): Transform[] {
		return transformsStack.flat()
	}

	function getCurrentGroupParams(): GroupParams {
		return groupParamsStack.reduce(
			(acc, p) => ({
				opacity: acc.opacity * p.opacity,
				zIndex: acc.zIndex + p.zIndex,
			}),
			{ opacity: 1, zIndex: 0 },
		)
	}

	const handle: LayerHandle = {
		add(shape, options) {
			const transforms = options?.transforms ?? getCurrentTransforms()
			const groupParams = getCurrentGroupParams()
			const derivedShapeParams = {
				opacity: groupParams.opacity * shape.shapeParams.opacity,
				zIndex: groupParams.zIndex + shape.shapeParams.zIndex,
			}
			const mergedShapeParams = options?.shapeParams
				? {
						opacity: options.shapeParams.opacity ?? derivedShapeParams.opacity,
						zIndex: options.shapeParams.zIndex ?? derivedShapeParams.zIndex,
					}
				: derivedShapeParams

			const ctx = baseShapeToDrawingContext(shape, {
				id: options?.id,
				transforms,
				shapeParams: mergedShapeParams,
			})
			layer.setShape(ctx)
			return ctx.id
		},

		remove(id, options) {
			const ctx = layer.shapes.get(id)
			if (ctx) {
				layer.removeShape(ctx)
			} else if (options?.strict) {
				throw new Error(`Shape with id "${id}" not found`)
			}
		},

		rect(params) {
			return handle.add(
				new RectShape({
					x: params.x ?? 0,
					y: params.y ?? 0,
					width: params.width,
					height: params.height,
					opacity: params.opacity ?? 1,
					fillColor: params.fillColor,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
				}),
			)
		},

		circle(params) {
			return handle.add(
				new CircleShape({
					radius: params.radius,
					cx: params.cx ?? 0,
					cy: params.cy ?? 0,
					opacity: params.opacity ?? 1,
					fillColor: params.fillColor,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
				}),
			)
		},

		ellipse(params) {
			return handle.add(
				new EllipseShape({
					cx: params.cx ?? 0,
					cy: params.cy ?? 0,
					radiusX: params.radiusX,
					radiusY: params.radiusY,
					opacity: params.opacity ?? 1,
					rotation: params.rotation ?? 0,
					fillColor: params.fillColor,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
				}),
			)
		},

		line(params) {
			return handle.add(
				new LineShape({
					x1: params.x1,
					y1: params.y1,
					x2: params.x2,
					y2: params.y2,
					opacity: params.opacity ?? 1,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
				}),
			)
		},

		polygon(params) {
			return handle.add(
				new PolygonShape({
					points: params.points,
					closed: params.closed,
					opacity: params.opacity ?? 1,
					fillColor: params.fillColor,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
				}),
			)
		},

		text(params) {
			return handle.add(
				new TextShape({
					x: params.x ?? 0,
					y: params.y ?? 0,
					text: params.text,
					opacity: params.opacity ?? 1,
					font: params.font ?? '16px sans-serif',
					textAlign: params.textAlign ?? 'start',
					textBaseline: params.textBaseline ?? 'alphabetic',
					direction: params.direction ?? 'inherit',
					maxWidth: params.maxWidth,
					fillColor: params.fillColor,
					strokeColor: params.strokeColor,
					lineWidth: params.lineWidth ?? 1,
					zIndex: params.zIndex ?? 0,
					onReady: params.onReady,
				}),
			)
		},

		image(params) {
			return handle.add(
				new ImageShape({
					src: params.src,
					x: params.x ?? 0,
					y: params.y ?? 0,
					opacity: params.opacity ?? 1,
					width: params.width,
					height: params.height,
					zIndex: params.zIndex ?? 0,
					onReady: params.onReady,
				}),
			)
		},

		group(options, fn) {
			const ids: string[] = []
			const wrapper: LayerHandle = {
				add(shape, opts) {
					const id = handle.add(shape, opts)
					ids.push(id)
					return id
				},
				remove(id, opts) {
					return handle.remove(id, opts)
				},
				rect(p) {
					const id = handle.rect(p)
					ids.push(id)
					return id
				},
				circle(p) {
					const id = handle.circle(p)
					ids.push(id)
					return id
				},
				ellipse(p) {
					const id = handle.ellipse(p)
					ids.push(id)
					return id
				},
				line(p) {
					const id = handle.line(p)
					ids.push(id)
					return id
				},
				polygon(p) {
					const id = handle.polygon(p)
					ids.push(id)
					return id
				},
				text(p) {
					const id = handle.text(p)
					ids.push(id)
					return id
				},
				image(p) {
					const id = handle.image(p)
					ids.push(id)
					return id
				},
				group(opts, f) {
					return handle.group(opts, () => f(wrapper))
				},
			}

			const localTransforms: Transform[] = []
			if (options.translate) {
				localTransforms.push({ type: 'translate', ...options.translate })
			}
			if (options.scale) {
				localTransforms.push({ type: 'scale', ...options.scale })
			}
			if (options.rotate) {
				localTransforms.push({ type: 'rotation', ...options.rotate })
			}

			transformsStack.push(localTransforms)
			groupParamsStack.push({
				opacity: options.opacity ?? 1,
				zIndex: options.zIndex ?? 0,
			})

			try {
				fn(wrapper)
			} finally {
				transformsStack.pop()
				groupParamsStack.pop()
			}

			return ids
		},
	}

	return handle
}
