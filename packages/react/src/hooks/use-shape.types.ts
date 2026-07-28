import type { BaseShape, DrawEffects } from '@maxxam0n/canvasify-core'

export type UseShapeOptions = {
	listening?: boolean
	cursor?: string
	hitStrokeWidth?: number
} & DrawEffects

export type ShapeInteractionProps = UseShapeOptions

type DrawingContextOnlyShapeProp = 'listening' | 'cursor' | 'hitStrokeWidth' | keyof DrawEffects

export type ShapeConstructorProps<T extends ShapeInteractionProps> = Omit<
	T,
	DrawingContextOnlyShapeProp
>

export type ShapeFactory<TShapeProps extends object> = (props: TShapeProps) => BaseShape
