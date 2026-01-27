import { useContext } from 'react'
import { TransformContext } from '../contexts/transform-context'

export const useInheritedTransforms = () => {
	const transforms = useContext(TransformContext)

	let translateX = 0
	let translateY = 0
	let scaleX = 1
	let scaleY = 1
	let angle = 0

	for (const transform of transforms) {
		if (transform.type === 'translate') {
			translateX += transform.translateX
			translateY += transform.translateY
		} else if (transform.type === 'scale') {
			scaleX *= transform.scaleX
			scaleY *= transform.scaleY
		} else if (transform.type === 'rotation') {
			angle += transform.angle
		}
	}

	return {
		translateX,
		translateY,
		angle,
		scaleX,
		scaleY,
	}
}
