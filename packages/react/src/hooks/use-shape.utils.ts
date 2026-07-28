import type {
	ShapeConstructorProps,
	ShapeInteractionProps,
	UseShapeOptions,
} from './use-shape.types'

export const splitShapeInteractionProps = <T extends ShapeInteractionProps>(
	props: T,
): [ShapeConstructorProps<T>, UseShapeOptions] => {
	const {
		listening,
		cursor,
		hitStrokeWidth,
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
			hitStrokeWidth,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			globalCompositeOperation,
		},
	]
}

export const haveSameShapeProps = (left: object, right: object): boolean => {
	if (left === right) return true

	const leftKeys = Reflect.ownKeys(left)
	const rightKeys = Reflect.ownKeys(right)
	if (leftKeys.length !== rightKeys.length) return false

	const leftRecord = left as Readonly<Record<PropertyKey, unknown>>
	const rightRecord = right as Readonly<Record<PropertyKey, unknown>>

	return leftKeys.every(
		key =>
			Object.prototype.hasOwnProperty.call(rightRecord, key) &&
			Object.is(leftRecord[key], rightRecord[key]),
	)
}
