import type { PropsWithChildren } from 'react'

export interface GroupProps extends PropsWithChildren {
	x: number
	y: number
	opacity?: number
	zIndex?: number
}
