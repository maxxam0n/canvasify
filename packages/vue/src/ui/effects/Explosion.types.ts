export interface ExplosionProps {
	id: string
	size: number
	duration: number
	x: number
	y: number
	power?: number
	onComplete: (id: string) => void
}
