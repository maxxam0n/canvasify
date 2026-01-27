export interface AnimationEffectProps {
	x: number
	y: number
	id: string
	duration: number
	onComplete: (id: string) => void
}

export type Particle = {
	x: number
	y: number
	vx: number
	vy: number
	/**
	 * Время жизни в «кадрах» при 60fps (чтобы совпадать с логикой частиц).
	 */
	life: number
	initialLife: number
	color: string
	size: number
}

export type CreateRadialParticlesOptions = {
	cx: number
	cy: number
	count: number
	colors: string[]
	/**
	 * Диапазон скорости в px на кадр при 60fps.
	 */
	speedMin?: number
	speedMax?: number
	/**
	 * Диапазон времени жизни в кадрах при 60fps.
	 */
	lifeMin?: number
	lifeMax?: number
	/**
	 * Диапазон размера частицы в px.
	 */
	sizeMin?: number
	sizeMax?: number
	/**
	 * Инъекция RNG для детерминизма/тестов.
	 */
	random?: () => number
}

export type StepParticlesOptions = {
	/**
	 * Гравитация в px на кадр^2 при 60fps.
	 * Совпадает с прежней логикой в `Particle.vue`.
	 */
	gravity?: number
}
