export type CanvasRefExpose = import('@maxxam0n/canvasify-core').CanvasComponentExpose & {
	getCore: () => import('@maxxam0n/canvasify-core').Canvas
	getLayer: (name: string) => import('@maxxam0n/canvasify-core').Layer | undefined
}
