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

class FailingMockImage {
	public onload: (() => void) | null = null
	public onerror: (() => void) | null = null
	public naturalWidth = 0
	public naturalHeight = 0
	private _src = ''

	public set src(value: string) {
		this._src = value
		this.onerror?.()
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

	it('notifies subscribeInvalidate after image loads', async () => {
		vi.stubGlobal('Image', MockImage)
		const onInvalidate = vi.fn()

		const shape = new ImageShape({ src: '/demo.png' })
		shape.subscribeInvalidate(onInvalidate)

		await Promise.resolve()

		expect(onInvalidate).toHaveBeenCalledTimes(1)
	})

	it('calls onError and notifies invalidate when image fails to load', async () => {
		vi.stubGlobal('Image', FailingMockImage)
		const onError = vi.fn()
		const onReady = vi.fn()
		const onInvalidate = vi.fn()
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

		const shape = new ImageShape({ src: '/missing.png', onError, onReady })
		shape.subscribeInvalidate(onInvalidate)

		await vi.waitFor(() => {
			expect(onError).toHaveBeenCalledTimes(1)
		})

		expect(onError).toHaveBeenCalledWith(expect.any(Error))
		expect(onError.mock.calls[0]?.[0]?.message).toBe('Failed to load image')
		expect(onReady).not.toHaveBeenCalled()
		expect(onInvalidate).toHaveBeenCalledTimes(1)
		expect(consoleError).toHaveBeenCalledWith(expect.any(Error))

		consoleError.mockRestore()
	})
})
