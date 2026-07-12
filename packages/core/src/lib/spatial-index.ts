import type { Rect } from '../model/rect.types'
import type { ShapeDrawingContext } from '../model/shape.types'

export const DEFAULT_SPATIAL_CELL_SIZE = 32
export const DEFAULT_SPATIAL_THRESHOLD = 64

export type SpatialIndexConfig = {
	cellSize: number
	threshold: number
}

export type SpatialIndexOptions = boolean | Partial<SpatialIndexConfig>

export type ResolvedSpatialIndexConfig = SpatialIndexConfig & {
	enabled: boolean
}

export type SpatialIndexBoundsResolver = (shape: ShapeDrawingContext) => Rect | undefined

export const resolveSpatialIndexConfig = (
	options?: SpatialIndexOptions,
): ResolvedSpatialIndexConfig => {
	if (options === false) {
		return {
			enabled: false,
			cellSize: DEFAULT_SPATIAL_CELL_SIZE,
			threshold: DEFAULT_SPATIAL_THRESHOLD,
		}
	}

	if (options === true || options === undefined) {
		return {
			enabled: true,
			cellSize: DEFAULT_SPATIAL_CELL_SIZE,
			threshold: DEFAULT_SPATIAL_THRESHOLD,
		}
	}

	return {
		enabled: true,
		cellSize: options.cellSize ?? DEFAULT_SPATIAL_CELL_SIZE,
		threshold: options.threshold ?? DEFAULT_SPATIAL_THRESHOLD,
	}
}

const cellKey = (cellX: number, cellY: number): string => `${cellX},${cellY}`

const boundsToCellRange = (
	bounds: Rect,
	cellSize: number,
): { minCellX: number; minCellY: number; maxCellX: number; maxCellY: number } => {
	const minCellX = Math.floor(bounds.x / cellSize)
	const minCellY = Math.floor(bounds.y / cellSize)
	const maxCellX = Math.floor((bounds.x + bounds.width) / cellSize)
	const maxCellY = Math.floor((bounds.y + bounds.height) / cellSize)

	return { minCellX, minCellY, maxCellX, maxCellY }
}

/**
 * Равномерная сетка для broad-phase hit-test.
 * Фигуры без world-bounds попадают в отдельный «unbounded» bucket и всегда
 * возвращаются как кандидаты.
 */
export class UniformGridSpatialIndex {
	private readonly cellSize: number
	private readonly cells = new Map<string, Set<string>>()
	private readonly shapesById = new Map<string, ShapeDrawingContext>()
	private readonly unboundedIds = new Set<string>()

	constructor(cellSize: number = DEFAULT_SPATIAL_CELL_SIZE) {
		this.cellSize = cellSize > 0 ? cellSize : DEFAULT_SPATIAL_CELL_SIZE
	}

	public clear(): void {
		this.cells.clear()
		this.shapesById.clear()
		this.unboundedIds.clear()
	}

	public rebuild(
		shapes: Iterable<ShapeDrawingContext>,
		resolveBounds: SpatialIndexBoundsResolver,
	): void {
		this.clear()

		for (const shape of shapes) {
			this.shapesById.set(shape.id, shape)

			const bounds = resolveBounds(shape)
			if (!bounds) {
				this.unboundedIds.add(shape.id)
				continue
			}

			const { minCellX, minCellY, maxCellX, maxCellY } = boundsToCellRange(bounds, this.cellSize)

			for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
				for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
					const key = cellKey(cellX, cellY)
					let bucket = this.cells.get(key)
					if (!bucket) {
						bucket = new Set()
						this.cells.set(key, bucket)
					}
					bucket.add(shape.id)
				}
			}
		}
	}

	public queryCandidates(x: number, y: number): ShapeDrawingContext[] {
		const candidateIds = new Set<string>()

		for (const id of this.unboundedIds) {
			candidateIds.add(id)
		}

		const cellX = Math.floor(x / this.cellSize)
		const cellY = Math.floor(y / this.cellSize)
		const bucket = this.cells.get(cellKey(cellX, cellY))

		if (bucket) {
			for (const id of bucket) {
				candidateIds.add(id)
			}
		}

		const candidates: ShapeDrawingContext[] = []
		for (const id of candidateIds) {
			const shape = this.shapesById.get(id)
			if (shape) candidates.push(shape)
		}

		return candidates
	}
}
