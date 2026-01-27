import { describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../../__tests__/test.utils'
import { ImageShape } from './Image'

class MockImage {
	public onload: (() => void) | null = null
	public onerror: (() => void) | null = null
	public naturalWidth = 80
	public naturalHeight = 40
	private _src = ''

	public set src(value: string) {
		this._src = value
		this.onload?.()
	}

	public get src() {
		return this._src
	}
}

describe('ImageShape', () => {
	it('draws loaded image and triggers onReady', async () => {
		vi.stubGlobal('Image', MockImage)
		const onReady = vi.fn()
		const { ctx, calls } = createMockContext()

		const shape = new ImageShape({ src: '/demo.png', x: 2, y: 3, onReady })

		await Promise.resolve()

		shape.draw(ctx)

		expect(onReady).toHaveBeenCalledTimes(1)
		expect(calls).toEqual([{ name: 'drawImage', args: [expect.any(MockImage), 2, 3, 80, 40] }])
	})
})
