export {
	WORKER_PROTOCOL_VERSION,
	type MainToWorkerMessage,
	type WorkerCircleSnapshot,
	type WorkerDisposeMessage,
	type WorkerEllipseSnapshot,
	type WorkerErrorCode,
	type WorkerErrorMessage,
	type WorkerFrameDoneMessage,
	type WorkerInitMessage,
	type WorkerLineSnapshot,
	type WorkerPathSnapshot,
	type WorkerPolygonSnapshot,
	type WorkerProtocolVersion,
	type WorkerReadyMessage,
	type WorkerRectSnapshot,
	type WorkerRenderMessage,
	type WorkerResizeMessage,
	type WorkerSerializablePaint,
	type WorkerSetShapesMessage,
	type WorkerShapeKind,
	type WorkerShapeSnapshot,
	type WorkerShapeSnapshotBase,
	type WorkerToMainMessage,
} from './worker.types'

export {
	applyMainToWorkerMessage,
	createInitialWorkerState,
	type ApplyMainToWorkerResult,
	type WorkerRenderState,
} from './worker-state'

export {
	createMockWorkerPort,
	createRealWorkerPort,
	type CreateMockWorkerPortOptions,
	type MockWorkerPort,
	type RealWorkerPortOptions,
	type WorkerRenderPort,
} from './worker-port'

export {
	drawWorkerShapes,
	type DrawWorkerShapesOptions,
	type Worker2DContext,
} from './draw-worker-shapes'

export {
	shapeToWorkerSnapshot,
	shapesMapToWorkerSnapshots,
	toWorkerSnapshot,
	type ShapeToWorkerSnapshotContext,
} from './snapshot.mapper'
