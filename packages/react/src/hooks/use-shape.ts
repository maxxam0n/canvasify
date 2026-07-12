import { useContext, useEffect, useId, useMemo } from 'react'
import {
	applyTransformsToCtx,
	type BaseShape,
	type DrawEffects,
	type ShapeDrawingContext,
} from '@maxxam0n/canvasify-core'

import { GroupContext } from '../contexts/group-context'
import { LayerContext } from '../contexts/layer-context'
import { TransformContext } from '../contexts/transform-context'

export type UseShapeOptions = {
	listening?: boolean
	cursor?: string
	hitStrokeWidth?: number
} & DrawEffects

export type ShapeInteractionProps = UseShapeOptions

export const splitShapeInteractionProps = <T extends ShapeInteractionProps>(
	props: T,
): [Omit<T, 'listening' | 'cursor' | keyof DrawEffects>, UseShapeOptions] => {
	const {
		listening,
		cursor,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
		...shapeProps
	} = props

	return [
		shapeProps,
		{
			listening,
			cursor,
			hitStrokeWidth: props.hitStrokeWidth,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			globalCompositeOperation,
		},
	]
}

export const useShape = (shape: BaseShape | null, options?: UseShapeOptions) => {
	const layer = useContext(LayerContext)
	const transforms = useContext(TransformContext)
	const groupParams = useContext(GroupContext)
	const id = useId()

	const {
		listening,
		cursor,
		hitStrokeWidth,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	} = options ?? {}

	if (layer === undefined) {
		throw new Error('failed to register shape: layer not found')
	}

	const derived = useMemo(() => {
		if (!shape) return null

		const { opacity: groupOpacity = 1, zIndex: groupZIndex = 0 } = groupParams ?? {}

		return {
			shape,
			opacity: groupOpacity * shape.shapeParams.opacity,
			zIndex: groupZIndex + shape.shapeParams.zIndex,
		}
	}, [shape, groupParams])

	useEffect(() => {
		if (!derived || !layer) return

		const shapeContext: ShapeDrawingContext = {
			id,
			shapeParams: {
				opacity: derived.opacity,
				zIndex: derived.zIndex,
			},
			meta: derived.shape.meta,
			transforms,
			draw: (ctx: CanvasRenderingContext2D) => derived.shape.draw(ctx),
			transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, transforms),
			contains: derived.shape.contains
				? (x, y) => derived.shape.contains!(x, y)
				: undefined,
			getLocalBounds: derived.shape.getLocalBounds
				? () => derived.shape.getLocalBounds!()
				: undefined,
			listening,
			hitStrokeWidth,
			cursor,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			globalCompositeOperation,
		}

		layer.setShape(shapeContext, { source: derived.shape })
		const unsubscribe = derived.shape.subscribeInvalidate?.(() => layer.invalidateShape(id))

		return () => {
			unsubscribe?.()
			layer.removeShape(shapeContext)
		}
	}, [
		id,
		derived,
		layer,
		transforms,
		listening,
		hitStrokeWidth,
		cursor,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	])
}
