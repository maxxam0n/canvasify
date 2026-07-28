export type LogicalPoint = {
	x: number
	y: number
}

const resolveAxisScale = (logicalSize: number, renderedSize: number): number => {
	if (logicalSize <= 0 || renderedSize <= 0) return 1
	return logicalSize / renderedSize
}

export const clientToLogical = (
	target: HTMLElement,
	clientX: number,
	clientY: number,
): LogicalPoint => {
	const rect = target.getBoundingClientRect()
	const scaleX = resolveAxisScale(target.clientWidth, rect.width)
	const scaleY = resolveAxisScale(target.clientHeight, rect.height)

	return {
		x: (clientX - rect.left) * scaleX,
		y: (clientY - rect.top) * scaleY,
	}
}
