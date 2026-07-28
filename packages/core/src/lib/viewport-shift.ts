import type { Rect } from '../model/rect.types'

export type ViewportShiftPlan = {
	offset: { x: number; y: number }
	overlap: Rect
	exposedRegions: Rect[]
}

type BitmapSize = {
	width: number
	height: number
}

const PHYSICAL_OFFSET_TOLERANCE = 1e-6

const appendRegion = (regions: Rect[], region: Rect): void => {
	if (region.width > 0 && region.height > 0) {
		regions.push(region)
	}
}

export const createViewportShiftPlan = (previous: Rect, next: Rect): ViewportShiftPlan | null => {
	if (
		previous.width !== next.width ||
		previous.height !== next.height ||
		(previous.x === next.x && previous.y === next.y)
	) {
		return null
	}

	const overlapLeft = Math.max(previous.x, next.x)
	const overlapTop = Math.max(previous.y, next.y)
	const overlapRight = Math.min(previous.x + previous.width, next.x + next.width)
	const overlapBottom = Math.min(previous.y + previous.height, next.y + next.height)

	if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
		return null
	}

	const overlap: Rect = {
		x: overlapLeft,
		y: overlapTop,
		width: overlapRight - overlapLeft,
		height: overlapBottom - overlapTop,
	}
	const exposedRegions: Rect[] = []
	const nextRight = next.x + next.width
	const nextBottom = next.y + next.height

	appendRegion(exposedRegions, {
		x: next.x,
		y: next.y,
		width: next.width,
		height: overlapTop - next.y,
	})
	appendRegion(exposedRegions, {
		x: next.x,
		y: overlapBottom,
		width: next.width,
		height: nextBottom - overlapBottom,
	})
	appendRegion(exposedRegions, {
		x: next.x,
		y: overlapTop,
		width: overlapLeft - next.x,
		height: overlap.height,
	})
	appendRegion(exposedRegions, {
		x: overlapRight,
		y: overlapTop,
		width: nextRight - overlapRight,
		height: overlap.height,
	})

	return {
		offset: {
			x: previous.x - next.x,
			y: previous.y - next.y,
		},
		overlap,
		exposedRegions,
	}
}

export const resolvePhysicalViewportShift = (
	plan: ViewportShiftPlan,
	bitmap: BitmapSize,
	viewport: Rect,
): { x: number; y: number } | null => {
	const rawX = plan.offset.x * (bitmap.width / viewport.width)
	const rawY = plan.offset.y * (bitmap.height / viewport.height)
	const x = Math.round(rawX)
	const y = Math.round(rawY)

	if (
		Math.abs(rawX - x) > PHYSICAL_OFFSET_TOLERANCE ||
		Math.abs(rawY - y) > PHYSICAL_OFFSET_TOLERANCE ||
		(x === 0 && y === 0) ||
		Math.abs(x) >= bitmap.width ||
		Math.abs(y) >= bitmap.height
	) {
		return null
	}

	return { x, y }
}
