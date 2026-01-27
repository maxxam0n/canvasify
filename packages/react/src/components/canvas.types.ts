import type { PropsWithChildren } from 'react'

export interface CanvasProps extends PropsWithChildren {
	width?: number
	height?: number
	bgColor?: string
}
