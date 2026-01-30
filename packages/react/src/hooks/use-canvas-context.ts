import { useContext } from 'react'
import type { Canvas, GroupParams, Layer, Transform } from '@maxxam0n/canvasify-core'

import { CanvasContext } from '../contexts/canvas-context'
import { CanvasSizeContext } from '../contexts/canvas-size-context'
import type { CanvasSize } from '../contexts/canvas-size-context'
import { GroupContext } from '../contexts/group-context'
import { LayerContext } from '../contexts/layer-context'
import { TransformContext } from '../contexts/transform-context'

export const useCurrentLayer = (): Layer | null | undefined => {
	return useContext(LayerContext)
}

export const useCurrentCanvas = (): Canvas | null => {
	return useContext(CanvasContext)
}

export const useCanvasSize = (): CanvasSize | null => {
	return useContext(CanvasSizeContext)
}

export const useCurrentGroup = (): GroupParams | null => {
	return useContext(GroupContext)
}

export const useCurrentTransforms = (): Transform[] => {
	return useContext(TransformContext)
}
