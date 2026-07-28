import { baseShapeToDrawingContext } from '../lib/shape-context.utils'
import type { Layer } from '../core/Layer'
import type { GroupParams } from '../model/types'
import type { LayerHandle } from './scene.types'
import type { Transform } from '../model/transform.types'
import { CircleShape } from '../core/shapes/Circle'
import { EllipseShape } from '../core/shapes/Ellipse'
import { ImageShape } from '../core/shapes/Image'
import { LineShape } from '../core/shapes/Line'
import { PathShape } from '../core/shapes/Path'
import { PolygonShape } from '../core/shapes/Polygon'
import { RectShape } from '../core/shapes/Rect'
import { TextShape } from '../core/shapes/Text'

const layerHandleDisposers = new WeakMap<LayerHandle, () => void>()

export const disposeLayerHandle = (handle: LayerHandle): void => {
	const dispose = layerHandleDisposers.get(handle)
	if (!dispose) return

	layerHandleDisposers.delete(handle)
	dispose()
}

export function createLayerHandle(layer: Layer): LayerHandle {
	const transformsStack: Transform[][] = []
	const groupParamsStack: GroupParams[] = []
	const invalidateUnsubs = new Map<string, () => void>()
	let disposed = false

	const assertActive = (): void => {
		if (disposed) {
			throw new Error('Layer handle is disposed')
		}
	}

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
			assertActive()
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
				listening: options?.listening,
				cursor: options?.cursor,
				hitStrokeWidth: options?.hitStrokeWidth,
				shadowColor: options?.shadowColor,
				shadowBlur: options?.shadowBlur,
				shadowOffsetX: options?.shadowOffsetX,
				shadowOffsetY: options?.shadowOffsetY,
				globalCompositeOperation: options?.globalCompositeOperation,
			})
			invalidateUnsubs.get(ctx.id)?.()
			invalidateUnsubs.delete(ctx.id)
			layer.setShape(ctx, { source: shape })

			const unsubscribe = shape.subscribeInvalidate?.(() => layer.invalidateShape(ctx.id))
			if (unsubscribe) {
				invalidateUnsubs.set(ctx.id, unsubscribe)
			}

			return ctx.id
		},

		remove(id, options) {
			if (disposed) return
			invalidateUnsubs.get(id)?.()
			invalidateUnsubs.delete(id)

			const ctx = layer.shapes.get(id)
			if (ctx) {
				layer.removeShape(ctx)
			} else if (options?.strict) {
				throw new Error(`Shape with id "${id}" not found`)
			}
		},

		rect(params) {
			assertActive()
			return handle.add(new RectShape(params))
		},

		circle(params) {
			assertActive()
			return handle.add(new CircleShape(params))
		},

		ellipse(params) {
			assertActive()
			return handle.add(new EllipseShape(params))
		},

		line(params) {
			assertActive()
			return handle.add(new LineShape(params))
		},

		polygon(params) {
			assertActive()
			return handle.add(new PolygonShape(params))
		},

		text(params) {
			assertActive()
			return handle.add(new TextShape(params))
		},

		image(params) {
			assertActive()
			return handle.add(new ImageShape(params))
		},

		path(params) {
			assertActive()
			return handle.add(new PathShape(params))
		},

		hitTest(x, y) {
			if (disposed) return undefined
			return layer.hitTest(x, y)
		},

		group(options, fn) {
			assertActive()
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
				path(p) {
					const id = handle.path(p)
					ids.push(id)
					return id
				},
				hitTest(px, py) {
					return handle.hitTest(px, py)
				},
				group(opts, f) {
					const nestedIds = handle.group(opts, f)
					ids.push(...nestedIds)
					return nestedIds
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
			if (options.clipRect) {
				localTransforms.push({ type: 'clip-rect', ...options.clipRect })
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

	layerHandleDisposers.set(handle, () => {
		disposed = true
		for (const unsubscribe of invalidateUnsubs.values()) {
			unsubscribe()
		}
		invalidateUnsubs.clear()
	})

	return handle
}
