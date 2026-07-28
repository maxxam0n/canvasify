import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockCanvas, createMockContext } from '../__tests__/test.utils'
import { Layer } from '../core/Layer'
import { createLayerHandle } from './LayerHandle'

describe('LayerHandle', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { devicePixelRatio: 1 })
	})

	it('adds shape via rect and returns id', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const id = handle.rect({ x: 10, y: 10, width: 50, height: 30, fillColor: 'blue' })

		expect(typeof id).toBe('string')
		expect(id.length).toBeGreaterThan(0)
		expect(layer.shapes.size).toBe(1)
		expect(layer.shapes.get(id)).toBeDefined()
	})

	it('removes shape by id', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const id = handle.rect({ width: 10, height: 10 })
		handle.remove(id)

		expect(layer.shapes.size).toBe(0)
	})

	it('remove with strict throws when id not found', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		expect(() => handle.remove('nonexistent', { strict: true })).toThrow(
			'Shape with id "nonexistent" not found',
		)
	})

	it('remove without strict is no-op when id not found', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		expect(() => handle.remove('nonexistent')).not.toThrow()
	})

	it('adds shapes via circle, ellipse, line, polygon, text, image', () => {
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
		vi.stubGlobal('Image', MockImage)

		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		handle.circle({ radius: 10, cx: 20, cy: 20 })
		handle.ellipse({ radiusX: 5, radiusY: 10, cx: 40, cy: 40 })
		handle.line({ x1: 0, y1: 0, x2: 50, y2: 50, strokeColor: 'red' })
		handle.polygon({
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 5, y: 10 },
			],
		})
		handle.text({ text: 'test', x: 10, y: 10 })
		handle.image({ src: '/test.png', x: 0, y: 0 })

		expect(layer.shapes.size).toBe(6)
	})

	it('group pushes transforms and groupParams to stack', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const ids = handle.group({ translate: { translateX: 20, translateY: 10 }, opacity: 0.8 }, l => {
			l.rect({ x: 0, y: 0, width: 50, height: 50, fillColor: 'blue' })
		})

		expect(ids).toHaveLength(1)
		expect(layer.shapes.size).toBe(1)
		const ctxEntry = Array.from(layer.shapes.values())[0]
		expect(ctxEntry.shapeParams.opacity).toBe(0.8)
		ctxEntry.transform(ctx)
		expect(calls.some(c => c.name === 'translate' && c.args[0] === 20 && c.args[1] === 10)).toBe(
			true,
		)
	})

	it('group applies scale and rotate transforms', () => {
		const { ctx, calls } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const ids = handle.group(
			{
				translate: { translateX: 10, translateY: 5 },
				scale: { scaleX: 2, scaleY: 2 },
				rotate: { angle: Math.PI / 2 },
				zIndex: 1,
			},
			l => {
				l.rect({ x: 0, y: 0, width: 20, height: 20, fillColor: 'red' })
			},
		)

		expect(ids).toHaveLength(1)
		expect(layer.shapes.size).toBe(1)
		const ctxEntry = Array.from(layer.shapes.values())[0]
		expect(ctxEntry.shapeParams.zIndex).toBe(1)
		ctxEntry.transform(ctx)
		expect(calls.some(c => c.name === 'translate' && c.args[0] === 10 && c.args[1] === 5)).toBe(
			true,
		)
		expect(calls.some(c => c.name === 'scale' && c.args[0] === 2 && c.args[1] === 2)).toBe(true)
		expect(calls.some(c => c.name === 'rotate')).toBe(true)
	})

	it('group returns ids for batch remove', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const ids = handle.group({ translate: { translateX: 10, translateY: 5 } }, l => {
			l.rect({ x: 0, y: 0, width: 20, height: 20 })
			l.circle({ radius: 5, cx: 10, cy: 10 })
		})

		expect(ids).toHaveLength(2)
		expect(layer.shapes.size).toBe(2)
		ids.forEach(id => handle.remove(id))
		expect(layer.shapes.size).toBe(0)
	})

	it('nested group collects all ids', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		let nestedIds: string[] = []
		const ids = handle.group({ translate: { translateX: 10, translateY: 0 } }, l => {
			l.rect({ x: 0, y: 0, width: 10, height: 10 })
			nestedIds = l.group({ translate: { translateX: 20, translateY: 10 } }, inner => {
				inner.rect({ x: 0, y: 0, width: 5, height: 5 })
				inner.circle({ radius: 3, cx: 0, cy: 0 })
			})
		})

		expect(ids).toHaveLength(3)
		expect(nestedIds).toHaveLength(2)
		expect(ids).toEqual(expect.arrayContaining(nestedIds))
		expect(layer.shapes.size).toBe(3)
	})

	it('add accepts BaseShape and returns id', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const customShape = {
			draw: vi.fn(),
			shapeParams: { zIndex: 0, opacity: 1 },
			meta: {},
		}
		const id = handle.add(customShape)

		expect(typeof id).toBe('string')
		expect(layer.shapes.size).toBe(1)
		expect(layer.shapes.get(id)?.meta).toEqual({})
	})

	it('unsubscribes the previous shape when an explicit id is replaced', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)
		const firstUnsubscribe = vi.fn()
		const secondUnsubscribe = vi.fn()

		handle.add(
			{
				draw: vi.fn(),
				shapeParams: { zIndex: 0, opacity: 1 },
				meta: { version: 1 },
				subscribeInvalidate: () => firstUnsubscribe,
			},
			{ id: 'stable-id' },
		)
		handle.add(
			{
				draw: vi.fn(),
				shapeParams: { zIndex: 0, opacity: 1 },
				meta: { version: 2 },
				subscribeInvalidate: () => secondUnsubscribe,
			},
			{ id: 'stable-id' },
		)

		expect(firstUnsubscribe).toHaveBeenCalledTimes(1)
		expect(secondUnsubscribe).not.toHaveBeenCalled()
		expect(layer.shapes.get('stable-id')?.meta).toEqual({ version: 2 })

		handle.remove('stable-id')
		expect(secondUnsubscribe).toHaveBeenCalledTimes(1)
	})

	it('image load triggers layer.invalidateShape via subscribeInvalidate', async () => {
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
		vi.stubGlobal('Image', MockImage)

		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const onDirty = vi.fn()
		const layer = new Layer({ name: 'main', canvas, onDirty })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		onDirty.mockClear()
		handle.image({ src: '/demo.png', x: 0, y: 0 })

		// setShape вызывает makeDirty один раз при добавлении
		expect(onDirty).toHaveBeenCalledTimes(1)
		onDirty.mockClear()

		await Promise.resolve()

		// после загрузки изображения — повторный makeDirty
		expect(onDirty).toHaveBeenCalledTimes(1)
	})

	it('add passes listening, cursor, hitStrokeWidth to drawing context', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const id = handle.add(
			{
				draw: vi.fn(),
				shapeParams: { zIndex: 0, opacity: 1 },
				meta: {},
			},
			{
				listening: false,
				cursor: 'pointer',
				hitStrokeWidth: 12,
			},
		)

		const shapeCtx = layer.shapes.get(id)
		expect(shapeCtx?.listening).toBe(false)
		expect(shapeCtx?.cursor).toBe('pointer')
		expect(shapeCtx?.hitStrokeWidth).toBe(12)
	})

	it('factories forward stroke style params to shape meta', () => {
		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)

		const strokeStyle = {
			lineCap: 'round' as const,
			lineJoin: 'bevel' as const,
			lineDash: [4, 2],
			lineDashOffset: 1,
		}

		const circleId = handle.circle({
			radius: 10,
			strokeColor: 'black',
			...strokeStyle,
		})
		const lineId = handle.line({
			x1: 0,
			y1: 0,
			x2: 10,
			y2: 10,
			strokeColor: 'red',
			...strokeStyle,
		})
		const polygonId = handle.polygon({
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 5, y: 10 },
			],
			strokeColor: 'green',
			...strokeStyle,
		})
		const textId = handle.text({
			text: 'hi',
			strokeColor: 'blue',
			...strokeStyle,
		})

		expect(layer.shapes.get(circleId)?.meta).toMatchObject(strokeStyle)
		expect(layer.shapes.get(lineId)?.meta).toMatchObject(strokeStyle)
		expect(layer.shapes.get(polygonId)?.meta).toMatchObject(strokeStyle)
		expect(layer.shapes.get(textId)?.meta).toMatchObject({ text: 'hi' })
	})

	it('image factory forwards onError callback', async () => {
		class MockImage {
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
		vi.stubGlobal('Image', MockImage)
		vi.spyOn(console, 'error').mockImplementation(() => {})

		const { ctx } = createMockContext()
		const { canvas } = createMockCanvas(ctx)
		const layer = new Layer({ name: 'main', canvas, onDirty: vi.fn() })
		layer.setSize(100, 100)
		const handle = createLayerHandle(layer)
		const onError = vi.fn()

		handle.image({ src: '/broken.png', x: 0, y: 0, onError })

		await vi.waitFor(() => {
			expect(onError).toHaveBeenCalledTimes(1)
		})

		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
	})
})
