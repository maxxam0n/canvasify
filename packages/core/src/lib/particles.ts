import type {
	CreateRadialParticlesOptions,
	Particle,
	StepParticlesOptions,
} from '../model/effects.types'

export const createRadialParticles = ({
	cx,
	cy,
	count,
	colors,
	speedMin = 1,
	speedMax = 4,
	lifeMin = 30,
	lifeMax = 90,
	sizeMin = 1,
	sizeMax = 3,
	random = Math.random,
}: CreateRadialParticlesOptions): Particle[] => {
	const particles: Particle[] = []
	const palette = colors.length ? colors : ['#ffffff']

	for (let i = 0; i < count; i++) {
		const angle = random() * Math.PI * 2
		const speed = random() * (speedMax - speedMin) + speedMin
		const life = random() * (lifeMax - lifeMin) + lifeMin
		const size = random() * (sizeMax - sizeMin) + sizeMin

		particles.push({
			x: cx,
			y: cy,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life,
			initialLife: life,
			color: palette[Math.floor(random() * palette.length)],
			size,
		})
	}

	return particles
}

/**
 * Обновляет частицы на месте, удаляя мертвые через swap-remove.
 * `dtMs` в миллисекундах.
 */
export const stepParticlesInPlace = (
	particles: Particle[],
	dtMs: number,
	{ gravity = 0.05 }: StepParticlesOptions = {},
) => {
	// Приведение к шкале "кадров" при 60fps
	const frameFactor = dtMs / (1000 / 60)

	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i]
		p.x += p.vx * frameFactor
		p.y += p.vy * frameFactor
		p.vy += gravity * frameFactor
		p.life -= frameFactor

		if (p.life <= 0) {
			particles[i] = particles[particles.length - 1]
			particles.pop()
		}
	}
}

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
	const baseAlpha = ctx.globalAlpha
	for (const p of particles) {
		ctx.globalAlpha = baseAlpha * (p.life / p.initialLife)
		ctx.beginPath()
		ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
		ctx.fillStyle = p.color
		ctx.fill()
	}
	ctx.globalAlpha = baseAlpha
}
