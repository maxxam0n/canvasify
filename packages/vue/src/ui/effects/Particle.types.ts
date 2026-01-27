export interface ParticleProps {
	id: string
	onComplete: (id: string) => void
	cx: number
	cy: number
	particleCount?: number
	duration?: number
	colors?: string[]
}
