import { describe, expect, it } from 'vitest'

import type { Transform } from '../model/transform.types'
import { createMockContext } from '../__tests__/test.utils'
import { applyTransformsToCtx } from './transform'

describe('applyTransformsToCtx', () => {
	it('applies translate, scale and rotation with origins', () => {
		const { ctx, calls } = createMockContext()

		const transforms: Transform[] = [
			{ type: 'translate', translateX: 10, translateY: 20 },
			{ type: 'scale', scaleX: 2, scaleY: 3, originX: 5, originY: 6 },
			{ type: 'rotation', angle: Math.PI / 2, originX: 7, originY: 8 },
		]

		applyTransformsToCtx(ctx, transforms)

		expect(calls).toEqual([
			{ name: 'translate', args: [10, 20] },
			{ name: 'translate', args: [5, 6] },
			{ name: 'scale', args: [2, 3] },
			{ name: 'translate', args: [-5, -6] },
			{ name: 'translate', args: [7, 8] },
			{ name: 'rotate', args: [Math.PI / 2] },
			{ name: 'translate', args: [-7, -8] },
		])
	})
})
