/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../__tests__/test.utils'
import { createMockWorkerPort, type MainToWorkerMessage } from '../worker'
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

	it('throws when options missing or invalid width/height', () => {
		const container = document.createElement('div')
		expect(() => new Scene(container)).toThrow('Scene requires finite width and height in options')
		expect(() => new Scene(container, { width: Number.NaN, height: 300 })).toThrow(
			'Scene requires finite width and height in options',
		)
		expect(() => new Scene(container, { width: -1, height: 300 })).toThrow(
			'Scene width and height must be non-negative',
		)
	})

	it('allows zero width or height', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 0, height: 0 })

		expect(container.style.width).toBe('0px')
		expect(container.style.height).toBe('0px')

		scene.destroy()
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

	it('rejects duplicate layer names before creating DOM nodes', () => {
		const container = document.createElement('div')

		expect(
			() =>
				new Scene(container, {
					width: 500,
					height: 300,
					layers: ['main', 'main'],
				}),
		).toThrow('Scene layer names must be unique')
		expect(container.children).toHaveLength(0)
	})

	it('rolls back container state when a layer cannot be initialized', () => {
		const container = document.createElement('div')
		container.style.position = 'fixed'
		container.style.width = '25px'
		container.style.height = '30px'
		container.style.backgroundColor = 'rgb(1, 2, 3)'

		const canvas = Document.prototype.createElement.call(document, 'canvas') as HTMLCanvasElement
		Object.defineProperty(canvas, 'getContext', {
			configurable: true,
			value: vi.fn(() => null),
		})
		vi.mocked(document.createElement).mockReturnValueOnce(canvas)

		expect(() => new Scene(container, { width: 500, height: 300 })).toThrow(
			'canvas context not found',
		)
		expect(container.children).toHaveLength(0)
		expect(container.style.position).toBe('fixed')
		expect(container.style.width).toBe('25px')
		expect(container.style.height).toBe('30px')
		expect(container.style.backgroundColor).toBe('rgb(1, 2, 3)')
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

	it('keeps size unchanged when setSize validation fails', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const canvas = container.querySelector('canvas')!

		expect(() => scene.setSize(Number.NaN, 200)).toThrow(
			'Scene requires finite width and height in options',
		)
		expect(() => scene.setSize(-1, 200)).toThrow('Scene width and height must be non-negative')
		expect(container.style.width).toBe('500px')
		expect(container.style.height).toBe('300px')
		expect(canvas.style.width).toBe('500px')
		expect(canvas.style.height).toBe('300px')

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

	it('destroy unsubscribes shape invalidation listeners', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const unsubscribe = vi.fn()
		const subscribeInvalidate = vi.fn(() => unsubscribe)

		scene.getLayer('default')!.add({
			draw: vi.fn(),
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
			subscribeInvalidate,
		})

		scene.destroy()
		scene.destroy()

		expect(subscribeInvalidate).toHaveBeenCalledTimes(1)
		expect(unsubscribe).toHaveBeenCalledTimes(1)
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

	it('setLayerOpacity updates canvas CSS opacity', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const canvasEl = container.querySelector('canvas')!

		expect(canvasEl.style.opacity).toBe('1')

		scene.setLayerOpacity('default', 0.4)

		expect(canvasEl.style.opacity).toBe('0.4')

		scene.destroy()
	})

	it('setLayerZIndex updates canvas CSS zIndex', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, {
			width: 500,
			height: 300,
			layers: ['bg', 'fg'],
		})
		const bgCanvas = container.children[0] as HTMLCanvasElement
		const fgCanvas = container.children[1] as HTMLCanvasElement

		expect(bgCanvas.style.zIndex).toBe('0')
		expect(fgCanvas.style.zIndex).toBe('1')

		scene.setLayerZIndex('bg', 5)

		expect(bgCanvas.style.zIndex).toBe('5')

		scene.destroy()
	})

	it('setLayerOpacity and setLayerZIndex throw when layer is missing', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })

		expect(() => scene.setLayerOpacity('missing', 0.5)).toThrow('Layer "missing" not found')
		expect(() => scene.setLayerZIndex('missing', 2)).toThrow('Layer "missing" not found')

		scene.destroy()
	})

	it('setLayerOpacity and setLayerZIndex no-op after destroy', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, { width: 500, height: 300 })
		const canvasEl = container.querySelector('canvas')!

		scene.destroy()

		expect(() => scene.setLayerOpacity('default', 0.2)).not.toThrow()
		expect(() => scene.setLayerZIndex('default', 9)).not.toThrow()
		expect(canvasEl.style.opacity).toBe('1')
		expect(canvasEl.style.zIndex).toBe('0')
	})

	it('hitTest respects runtime layer zIndex changes', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, {
			width: 500,
			height: 300,
			layers: ['bg', 'fg'],
		})
		const bg = scene.getLayer('bg')!
		const fg = scene.getLayer('fg')!

		const bgId = bg.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })
		const fgId = fg.rect({ x: 50, y: 50, width: 100, height: 100, fillColor: 'blue' })

		expect(scene.hitTest(75, 75)?.shapeId).toBe(fgId)

		scene.setLayerZIndex('bg', 10)

		expect(scene.hitTest(75, 75)?.shapeId).toBe(bgId)

		scene.destroy()
	})

	it('hitTest skips layer with opacity 0 after setLayerOpacity', () => {
		const container = document.createElement('div')
		const scene = new Scene(container, {
			width: 500,
			height: 300,
			layers: ['bg', 'fg'],
		})
		const bg = scene.getLayer('bg')!
		const fg = scene.getLayer('fg')!

		const bgId = bg.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })
		const fgId = fg.rect({ x: 50, y: 50, width: 100, height: 100, fillColor: 'blue' })

		scene.setLayerOpacity('fg', 0)

		expect(scene.hitTest(120, 75)).toBeUndefined()
		expect(scene.hitTest(25, 25)?.shapeId).toBe(bgId)

		scene.setLayerOpacity('fg', 1)

		expect(scene.hitTest(75, 75)?.shapeId).toBe(fgId)

		scene.destroy()
	})
})

const dispatchScenePointer = (
	target: HTMLElement,
	type: string,
	clientX: number,
	clientY: number,
): void => {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			clientX,
			clientY,
			pointerId: 1,
		}),
	)
}

describe('Scene pointer interaction', () => {
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

	it('fires shape enter/leave on pointer move', () => {
		const onShapePointerEnter = vi.fn()
		const onShapePointerLeave = vi.fn()
		const container = document.createElement('div')
		document.body.appendChild(container)
		container.getBoundingClientRect = vi.fn(() => ({
			left: 0,
			top: 0,
			right: 500,
			bottom: 300,
			width: 500,
			height: 300,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}))

		const scene = new Scene(container, {
			width: 500,
			height: 300,
			onShapePointerEnter,
			onShapePointerLeave,
		})
		const layer = scene.getLayer('default')!
		layer.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })
		layer.rect({ x: 200, y: 0, width: 100, height: 100, fillColor: 'blue' })

		dispatchScenePointer(container, 'pointermove', 50, 50)
		expect(onShapePointerEnter).toHaveBeenCalledTimes(1)

		dispatchScenePointer(container, 'pointermove', 250, 50)
		expect(onShapePointerLeave).toHaveBeenCalledTimes(1)
		expect(onShapePointerEnter).toHaveBeenCalledTimes(2)

		scene.destroy()
		container.remove()
	})

	it('fires click when pointer down and up on the same shape', () => {
		const onShapeClick = vi.fn()
		const container = document.createElement('div')
		document.body.appendChild(container)
		container.getBoundingClientRect = vi.fn(() => ({
			left: 0,
			top: 0,
			right: 500,
			bottom: 300,
			width: 500,
			height: 300,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}))

		const scene = new Scene(container, {
			width: 500,
			height: 300,
			onShapeClick,
		})
		scene.getLayer('default')!.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })

		dispatchScenePointer(container, 'pointerdown', 50, 50)
		dispatchScenePointer(container, 'pointerup', 50, 50)

		expect(onShapeClick).toHaveBeenCalledTimes(1)

		dispatchScenePointer(container, 'pointerdown', 50, 50)
		dispatchScenePointer(container, 'pointerup', 250, 50)
		expect(onShapeClick).toHaveBeenCalledTimes(1)

		scene.destroy()
		container.remove()
	})

	it('setInteractionHandlers updates handlers after construction', () => {
		const onShapePointerDown = vi.fn()
		const container = document.createElement('div')
		document.body.appendChild(container)
		container.getBoundingClientRect = vi.fn(() => ({
			left: 0,
			top: 0,
			right: 500,
			bottom: 300,
			width: 500,
			height: 300,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}))

		const scene = new Scene(container, { width: 500, height: 300 })
		scene.getLayer('default')!.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })
		scene.setInteractionHandlers({ onShapePointerDown })

		dispatchScenePointer(container, 'pointerdown', 50, 50)
		expect(onShapePointerDown).toHaveBeenCalledTimes(1)

		scene.setInteractionHandlers({ onShapePointerDown: undefined })
		dispatchScenePointer(container, 'pointerdown', 50, 50)
		expect(onShapePointerDown).toHaveBeenCalledTimes(1)

		scene.destroy()
		container.remove()
	})

	it('does not fire handlers after destroy', () => {
		const onShapePointerMove = vi.fn()
		const container = document.createElement('div')
		document.body.appendChild(container)
		container.getBoundingClientRect = vi.fn(() => ({
			left: 0,
			top: 0,
			right: 500,
			bottom: 300,
			width: 500,
			height: 300,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}))

		const scene = new Scene(container, {
			width: 500,
			height: 300,
			onShapePointerMove,
		})
		scene.getLayer('default')!.rect({ x: 0, y: 0, width: 100, height: 100, fillColor: 'red' })
		scene.destroy()

		dispatchScenePointer(container, 'pointermove', 50, 50)
		expect(onShapePointerMove).not.toHaveBeenCalled()

		container.remove()
	})
})

describe('Scene workerRenderer', () => {
	let posted: MainToWorkerMessage[] = []

	const installWorkerGlobals = () => {
		vi.stubGlobal('window', { devicePixelRatio: 1 })
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				cb(0)
				return 1
			}),
		)
		vi.stubGlobal('cancelAnimationFrame', vi.fn())
		vi.stubGlobal(
			'OffscreenCanvas',
			class OffscreenCanvas {
				width = 0
				height = 0
				constructor(width = 0, height = 0) {
					this.width = width
					this.height = height
				}
			},
		)
		Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', {
			configurable: true,
			writable: true,
			value: function transferControlToOffscreen(this: HTMLCanvasElement) {
				return new OffscreenCanvas(this.width, this.height)
			},
		})

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
	}

	const createTrackedPort = () => {
		posted = []
		const port = createMockWorkerPort()
		const originalPost = port.post.bind(port)
		port.post = (message, transfer) => {
			posted.push(message)
			originalPost(message, transfer)
		}
		return port
	}

	beforeEach(() => {
		installWorkerGlobals()
	})

	it('posts setShapes via MockWorkerPort after layer.rect (setSize path)', () => {
		const port = createTrackedPort()
		const container = document.createElement('div')

		const scene = new Scene(container, {
			width: 500,
			height: 300,
			workerRenderer: {
				createWorker: () => {
					throw new Error('createWorker should not be called when port is injected')
				},
				port,
			},
		})

		expect(posted.some(message => message.type === 'init')).toBe(true)

		posted = []
		scene.getLayer('default')!.rect({
			x: 10,
			y: 20,
			width: 30,
			height: 40,
			fillColor: 'red',
		})

		expect(posted.filter(message => message.type === 'setShapes')).toEqual([
			expect.objectContaining({
				type: 'setShapes',
				shapes: [
					expect.objectContaining({
						kind: 'rect',
						x: 10,
						y: 20,
						width: 30,
						height: 40,
					}),
				],
			}),
		])

		scene.destroy()
	})

	it('workerLayers filters which layers use the worker', () => {
		const port = createTrackedPort()
		const container = document.createElement('div')

		const scene = new Scene(container, {
			width: 500,
			height: 300,
			layers: ['bg', 'fg'],
			workerRenderer: {
				createWorker: () => {
					throw new Error('createWorker should not be called when port is injected')
				},
				port,
			},
			workerLayers: ['fg'],
		})

		// Только fg получил worker — один init от setSize
		expect(posted.filter(message => message.type === 'init')).toHaveLength(1)

		posted = []
		scene.getLayer('bg')!.rect({
			x: 0,
			y: 0,
			width: 50,
			height: 50,
			fillColor: 'blue',
		})
		expect(posted.some(message => message.type === 'setShapes')).toBe(false)

		posted = []
		scene.getLayer('fg')!.rect({
			x: 10,
			y: 10,
			width: 20,
			height: 20,
			fillColor: 'green',
		})
		expect(posted.filter(message => message.type === 'setShapes')).toEqual([
			expect.objectContaining({
				type: 'setShapes',
				shapes: [expect.objectContaining({ kind: 'rect', fillColor: 'green' })],
			}),
		])

		scene.destroy()
	})

	it('terminates earlier owned workers when a later layer fails to initialize', () => {
		const container = document.createElement('div')
		const firstWorker = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			postMessage: vi.fn(),
			terminate: vi.fn(),
		} as unknown as Worker
		const createWorker = vi
			.fn<() => Worker>()
			.mockReturnValueOnce(firstWorker)
			.mockImplementationOnce(() => {
				throw new Error('worker initialization failed')
			})

		expect(
			() =>
				new Scene(container, {
					width: 500,
					height: 300,
					layers: ['first', 'second'],
					workerRenderer: { createWorker },
				}),
		).toThrow('worker initialization failed')

		expect(container.children).toHaveLength(0)
		expect(firstWorker.removeEventListener).toHaveBeenCalledTimes(1)
		expect(firstWorker.terminate).toHaveBeenCalledTimes(1)
	})
})
