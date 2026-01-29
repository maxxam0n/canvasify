/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../__tests__/test.utils'
import { Scene } from './Scene'

describe('Scene', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 1 })
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				cb(0)
				return 1
			}),
		)
		vi.stubGlobal('cancelAnimationFrame', vi.fn())

		const originalCreateElement = document.createElement.bind(document)
		vi.stubGlobal(
			'document',
			Object.assign(document, {
				createElement: vi.fn((tagName: string) => {
					const el = originalCreateElement(tagName)
					if (tagName === 'canvas') {
						const canvasEl = el as HTMLCanvasElement
						const { ctx } = createMockContext()
						Object.assign(canvasEl, {
							getContext: vi.fn(() => ctx),
							toDataURL: vi.fn(() => 'data:image/png;base64,stub'),
							toBlob: vi.fn((cb: BlobCallback) => cb(new Blob(['stub'], { type: 'image/png' }))),
						})
					}
					return el
				}),
			}),
		)
	})

	it('throws when options missing width or height', () => {
		const container = document.createElement('div')
		expect(() => new Scene(container, { width: 0, height: 300 })).toThrow(
			'Scene requires width and height in options',
		)
		expect(() => new Scene(container, { width: 500, height: 0 })).toThrow(
			'Scene requires width and height in options',
		)
		expect(() => new Scene(container)).toThrow('Scene requires width and height in options')
	})

	it('creates canvas elements and layers', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		expect(container.children.length).toBe(1)
		expect(container.children[0].tagName).toBe('CANVAS')
		expect(container.style.position).toBe('relative')
		expect(container.style.width).toBe('500px')
		expect(container.style.height).toBe('300px')

		const layer = scene.getLayer('default')
		expect(layer).toBeDefined()
		expect(scene.getLayer('nonexistent')).toBeUndefined()

		scene.destroy()
	})

	it('creates multiple layers when specified', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, {
			width: 500,
			height: 300,
			layers: ['bg', 'fg'],
		})

		expect(container.children.length).toBe(2)
		expect(scene.getLayer('bg')).toBeDefined()
		expect(scene.getLayer('fg')).toBeDefined()

		scene.destroy()
	})

	it('adds and removes shapes via layer handle', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const layer = scene.getLayer('default')!

		const id = layer.rect({ x: 10, y: 10, width: 100, height: 50, fillColor: 'blue' })

		expect(typeof id).toBe('string')
		expect(id.length).toBeGreaterThan(0)

		layer.remove(id)
		scene.destroy()
	})

	it('setSize updates container and layers', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		scene.setSize(800, 600)

		expect(container.style.width).toBe('800px')
		expect(container.style.height).toBe('600px')

		scene.destroy()
	})

	it('destroy removes canvas elements and clears state', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const canvasEl = container.querySelector('canvas')!
		const removeSpy = vi.spyOn(canvasEl, 'remove')

		scene.destroy()

		expect(removeSpy).toHaveBeenCalled()
		expect(scene.getLayer('default')).toBeUndefined()

		scene.destroy()
		expect(removeSpy).toHaveBeenCalledTimes(1)
	})

	it('render and requestRender do not throw', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		expect(() => scene.render()).not.toThrow()
		expect(() => scene.requestRender()).not.toThrow()

		scene.destroy()
	})

	it('toDataURL returns string', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		const dataUrl = scene.toDataURL()
		expect(typeof dataUrl).toBe('string')
		expect(dataUrl.startsWith('data:')).toBe(true)

		scene.destroy()
	})

	it('toBlob returns Blob', async () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		const blob = await scene.toBlob()
		expect(blob).toBeInstanceOf(Blob)

		scene.destroy()
	})

	it('methods no-op after destroy', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		scene.destroy()

		expect(() => scene.setSize(100, 100)).not.toThrow()
		expect(() => scene.render()).not.toThrow()
		expect(() => scene.requestRender()).not.toThrow()
	})

	it('toDataURL and toBlob throw after destroy', async () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		scene.destroy()

		expect(() => scene.toDataURL()).toThrow('Scene is destroyed')
		await expect(scene.toBlob()).rejects.toThrow('Scene is destroyed')
	})
})
