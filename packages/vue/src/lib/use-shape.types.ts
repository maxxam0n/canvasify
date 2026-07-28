import type { DrawEffects } from '@maxxam0n/canvasify-core'

/** Параметры взаимодействия и эффекты отрисовки на уровне ShapeDrawingContext. */
export type UseShapeOptions = {
	listening?: boolean
	cursor?: string
	hitStrokeWidth?: number
} & DrawEffects

export type ShapeInteractionProps = UseShapeOptions
