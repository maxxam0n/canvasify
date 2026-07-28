import { useContext, useEffect, useId, useRef } from 'react'
import {
	applyTransformsToCtx,
	type BaseShape,
	type GroupParams,
	type Layer,
	type ShapeDrawingContext,
	type Transform,
} from '@maxxam0n/canvasify-core'

import { GroupContext } from '../contexts/group-context'
import { LayerContext } from '../contexts/layer-context'
import { TransformContext } from '../contexts/transform-context'

import type { ShapeFactory, UseShapeOptions } from './use-shape.types'
import { haveSameShapeProps } from './use-shape.utils'

export { splitShapeInteractionProps } from './use-shape.utils'
export type {
	ShapeConstructorProps,
	ShapeInteractionProps,
	UseShapeOptions,
} from './use-shape.types'

type ShapeEnvironment = {
	id: string
	layer: Layer | null | undefined
	transforms: Transform[]
	groupParams: GroupParams | null
	listening: boolean | undefined
	cursor: string | undefined
	hitStrokeWidth: number | undefined
	shadowColor: string | undefined
	shadowBlur: number | undefined
	shadowOffsetX: number | undefined
	shadowOffsetY: number | undefined
	globalCompositeOperation: GlobalCompositeOperation | undefined
}

type ManagedShape<TShapeProps extends object> = {
	factory: ShapeFactory<TShapeProps>
	props: TShapeProps
	shape: BaseShape
}

const useShapeEnvironment = (options?: UseShapeOptions): ShapeEnvironment => {
	const layer = useContext(LayerContext)
	const transforms = useContext(TransformContext)
	const groupParams = useContext(GroupContext)
	const id = useId()

	if (layer === undefined) {
		throw new Error('failed to register shape: layer not found')
	}

	return {
		id,
		layer,
		transforms,
		groupParams,
		listening: options?.listening,
		cursor: options?.cursor,
		hitStrokeWidth: options?.hitStrokeWidth,
		shadowColor: options?.shadowColor,
		shadowBlur: options?.shadowBlur,
		shadowOffsetX: options?.shadowOffsetX,
		shadowOffsetY: options?.shadowOffsetY,
		globalCompositeOperation: options?.globalCompositeOperation,
	}
}

const registerShape = (
	shape: BaseShape,
	environment: ShapeEnvironment & { layer: Layer },
): (() => void) => {
	const {
		id,
		layer,
		transforms,
		groupParams,
		listening,
		cursor,
		hitStrokeWidth,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	} = environment
	const { opacity: groupOpacity = 1, zIndex: groupZIndex = 0 } = groupParams ?? {}
	const shapeContext: ShapeDrawingContext = {
		id,
		shapeParams: {
			opacity: groupOpacity * shape.shapeParams.opacity,
			zIndex: groupZIndex + shape.shapeParams.zIndex,
		},
		meta: shape.meta,
		transforms,
		draw: (ctx: CanvasRenderingContext2D) => shape.draw(ctx),
		transform: (ctx: CanvasRenderingContext2D) => applyTransformsToCtx(ctx, transforms),
		contains: shape.contains
			? (x, y, hitStrokeWidth) => shape.contains!(x, y, hitStrokeWidth)
			: undefined,
		getLocalBounds: shape.getLocalBounds ? () => shape.getLocalBounds!() : undefined,
		listening,
		hitStrokeWidth,
		cursor,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	}

	layer.setShape(shapeContext, { source: shape })
	const unsubscribe = shape.subscribeInvalidate?.(() => layer.invalidateShape(id))

	return () => {
		unsubscribe?.()
		layer.removeShape(shapeContext)
	}
}

export const useShape = (shape: BaseShape | null, options?: UseShapeOptions) => {
	const {
		id,
		layer,
		transforms,
		groupParams,
		listening,
		cursor,
		hitStrokeWidth,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	} = useShapeEnvironment(options)

	useEffect(() => {
		if (!shape || !layer) return

		return registerShape(shape, {
			id,
			layer,
			transforms,
			groupParams,
			listening,
			cursor,
			hitStrokeWidth,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			globalCompositeOperation,
		})
	}, [
		id,
		shape,
		layer,
		transforms,
		groupParams,
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

export const useManagedShape = <TShapeProps extends object>(
	shapeProps: TShapeProps,
	createShape: ShapeFactory<TShapeProps>,
	options?: UseShapeOptions,
): void => {
	const managedShapeRef = useRef<ManagedShape<TShapeProps> | null>(null)
	const {
		id,
		layer,
		transforms,
		groupParams,
		listening,
		cursor,
		hitStrokeWidth,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	} = useShapeEnvironment(options)

	useEffect(() => {
		if (!layer) return

		const current = managedShapeRef.current
		const managedShape =
			current && current.factory === createShape && haveSameShapeProps(current.props, shapeProps)
				? current
				: {
						factory: createShape,
						props: shapeProps,
						shape: createShape(shapeProps),
					}

		managedShapeRef.current = managedShape

		return registerShape(managedShape.shape, {
			id,
			layer,
			transforms,
			groupParams,
			listening,
			cursor,
			hitStrokeWidth,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			globalCompositeOperation,
		})
	}, [
		id,
		layer,
		transforms,
		groupParams,
		shapeProps,
		createShape,
		listening,
		cursor,
		hitStrokeWidth,
		shadowColor,
		shadowBlur,
		shadowOffsetX,
		shadowOffsetY,
		globalCompositeOperation,
	])
}
