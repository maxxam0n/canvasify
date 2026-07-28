import type { PathCommand } from '../core/shapes/Path'
import type { DrawEffects } from '../model/draw-effects.types'
import type { LinearGradientPaint, RadialGradientPaint } from '../model/paint.types'
import type { Rect } from '../model/rect.types'
import type { StrokeStyle } from '../model/stroke.types'
import type { Transform } from '../model/transform.types'
import type { Point } from '../model/types'

/**
 * Версия wire-протокола main ↔ worker.
 * При несовпадении worker отвечает `error` и не принимает init.
 */
export const WORKER_PROTOCOL_VERSION = 1 as const

export type WorkerProtocolVersion = typeof WORKER_PROTOCOL_VERSION

/**
 * Paint, безопасный для structured clone (без PatternPaint / CanvasImageSource).
 */
export type WorkerSerializablePaint = string | LinearGradientPaint | RadialGradientPaint

/** Общие поля snapshot-фигуры для отрисовки в worker. */
export type WorkerShapeSnapshotBase = StrokeStyle &
	DrawEffects & {
		id: string
		zIndex: number
		opacity: number
		/** Уже data-only transforms; функции сюда не попадают. */
		transforms?: Transform[]
		fillColor?: WorkerSerializablePaint
		strokeColor?: WorkerSerializablePaint
		lineWidth?: number
	}

export type WorkerRectSnapshot = WorkerShapeSnapshotBase & {
	kind: 'rect'
	x: number
	y: number
	width: number
	height: number
}

export type WorkerCircleSnapshot = WorkerShapeSnapshotBase & {
	kind: 'circle'
	cx: number
	cy: number
	radius: number
}

export type WorkerEllipseSnapshot = WorkerShapeSnapshotBase & {
	kind: 'ellipse'
	cx: number
	cy: number
	radiusX: number
	radiusY: number
	rotation?: number
}

export type WorkerLineSnapshot = WorkerShapeSnapshotBase & {
	kind: 'line'
	x1: number
	y1: number
	x2: number
	y2: number
}

export type WorkerPolygonSnapshot = WorkerShapeSnapshotBase & {
	kind: 'polygon'
	points: Point[]
	closed?: boolean
}

export type WorkerPathSnapshot = WorkerShapeSnapshotBase & {
	kind: 'path'
	commands: PathCommand[]
}

/**
 * Сериализуемый снимок фигуры для worker paint.
 * Image / Text / PatternPaint в v1 не входят.
 */
export type WorkerShapeSnapshot =
	| WorkerRectSnapshot
	| WorkerCircleSnapshot
	| WorkerEllipseSnapshot
	| WorkerLineSnapshot
	| WorkerPolygonSnapshot
	| WorkerPathSnapshot

export type WorkerShapeKind = WorkerShapeSnapshot['kind']

/** Main → Worker: однократный init с transfer OffscreenCanvas. */
export type WorkerInitMessage = {
	type: 'init'
	protocolVersion: number
	logicalWidth: number
	logicalHeight: number
	dpr: number
	/**
	 * Ownership переходит worker'у через Transferable.
	 * После transfer main больше не владеет 2d-контекстом этого canvas.
	 */
	canvas: OffscreenCanvas
}

/** Full replace списка фигур (diff — вне MVP). */
export type WorkerSetShapesMessage = {
	type: 'setShapes'
	/**
	 * Монотонный номер кадра/батча с main.
	 * Сообщения с revision меньше уже принятой игнорируются (stale).
	 */
	revision: number
	shapes: WorkerShapeSnapshot[]
}

export type WorkerRenderMessage = {
	type: 'render'
	revision: number
	dirtyFull: boolean
	dirtyRects?: Rect[]
}

export type WorkerResizeMessage = {
	type: 'resize'
	logicalWidth: number
	logicalHeight: number
	dpr: number
}

export type WorkerDisposeMessage = {
	type: 'dispose'
}

export type MainToWorkerMessage =
	| WorkerInitMessage
	| WorkerSetShapesMessage
	| WorkerRenderMessage
	| WorkerResizeMessage
	| WorkerDisposeMessage

export type WorkerReadyMessage = {
	type: 'ready'
	protocolVersion: WorkerProtocolVersion
}

export type WorkerFrameDoneMessage = {
	type: 'frameDone'
	/** Echo revision принятого render — для ack / coalescing на main. */
	revision: number
}

export type WorkerErrorCode =
	| 'PROTOCOL_MISMATCH'
	| 'NOT_INITIALIZED'
	| 'ALREADY_INITIALIZED'
	| 'ALREADY_DISPOSED'
	| 'INVALID_STATE'

export type WorkerErrorMessage = {
	type: 'error'
	code: WorkerErrorCode
	message: string
}

export type WorkerToMainMessage = WorkerReadyMessage | WorkerFrameDoneMessage | WorkerErrorMessage
