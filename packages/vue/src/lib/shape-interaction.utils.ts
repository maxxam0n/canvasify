import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import type { DrawEffects } from '@maxxam0n/canvasify-core'

import type { ShapeInteractionProps, UseShapeOptions } from './use-shape.types'

/**
 * Defaults для withDefaults: без этого Vue кастит отсутствующий Boolean `listening` в `false`
 * и фигуры перестают участвовать в hit-test.
 */
export const shapeInteractionDefaults = {
	listening: undefined as boolean | undefined,
	cursor: undefined as string | undefined,
	hitStrokeWidth: undefined as number | undefined,
	shadowColor: undefined as string | undefined,
	shadowBlur: undefined as number | undefined,
	shadowOffsetX: undefined as number | undefined,
	shadowOffsetY: undefined as number | undefined,
	globalCompositeOperation: undefined as GlobalCompositeOperation | undefined,
}

type DrawingContextOnlyProps = 'listening' | 'cursor' | 'hitStrokeWidth' | keyof DrawEffects

const drawingContextOnlyProps = new Set<PropertyKey>([
	'listening',
	'cursor',
	'hitStrokeWidth',
	'shadowColor',
	'shadowBlur',
	'shadowOffsetX',
	'shadowOffsetY',
	'globalCompositeOperation',
])

/** Убирает поля уровня drawing context, не входящие в shape params. */
export const omitShapeInteractionProps = <T extends ShapeInteractionProps>(
	params: T,
): Omit<T, DrawingContextOnlyProps> => {
	const shapeProps: Record<PropertyKey, unknown> = {}
	for (const key of Reflect.ownKeys(params)) {
		if (!drawingContextOnlyProps.has(key)) {
			shapeProps[key] = params[key as keyof T]
		}
	}
	return shapeProps as Omit<T, DrawingContextOnlyProps>
}

export const useShapeInteractionOptions = (
	props: MaybeRefOrGetter<ShapeInteractionProps>,
): ComputedRef<UseShapeOptions> =>
	computed(() => {
		const value = toValue(props)
		return {
			listening: value.listening,
			cursor: value.cursor,
			hitStrokeWidth: value.hitStrokeWidth,
			shadowColor: value.shadowColor,
			shadowBlur: value.shadowBlur,
			shadowOffsetX: value.shadowOffsetX,
			shadowOffsetY: value.shadowOffsetY,
			globalCompositeOperation: value.globalCompositeOperation,
		}
	})
