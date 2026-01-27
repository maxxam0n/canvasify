import { useContext, useEffect, useId, useMemo } from 'react'
import {
	applyTransformsToCtx,
	type BaseShape,
	type ShapeDrawingContext,
} from '@maxxam0n/canvasify-core'

import { GroupContext } from '../contexts/group-context'
import { LayerContext } from '../contexts/layer-context'
import { TransformContext } from '../contexts/transform-context'

export const useShape = (shape: BaseShape | null) => {
	const layer = useContext(LayerContext)
	const transforms = useContext(TransformContext)
	const groupParams = useContext(GroupContext)
	const id = useId()

	if (layer === undefined) {
		throw new Error('Ошибка регистрации фигуры, отсутствует слой')
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
			draw: (ctx: CanvasRenderingContext2D) => derived.shape.draw(ctx),
			transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, transforms),
		}

		layer.setShape(shapeContext)

		return () => {
			layer.removeShape(shapeContext)
		}
	}, [id, derived, layer, transforms])
}
