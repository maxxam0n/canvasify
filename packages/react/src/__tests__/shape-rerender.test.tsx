/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import type { ShapeDrawingContext } from '@maxxam0n/canvasify-core'

import {
	Canvas,
	Circle,
	Ellipse,
	Image,
	Layer,
	Line,
	Path,
	Polygon,
	Rect,
	Text,
	type CanvasRefExpose,
} from '../index'

const createMock2dContext = () =>
	({
		globalAlpha: 1,
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 1,
		lineCap: 'butt',
		lineJoin: 'miter',
		lineDashOffset: 0,
		imageSmoothingEnabled: true,
		save: vi.fn(),
		restore: vi.fn(),
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		rect: vi.fn(),
		arc: vi.fn(),
		ellipse: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		bezierCurveTo: vi.fn(),
		quadraticCurveTo: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		fillText: vi.fn(),
		strokeText: vi.fn(),
		setLineDash: vi.fn(),
		setTransform: vi.fn(),
		scale: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		drawImage: vi.fn(),
		measureText: vi.fn(() => ({ width: 20 })),
	}) as unknown as CanvasRenderingContext2D

const getOnlyShape = (ref: React.RefObject<CanvasRefExpose | null>): ShapeDrawingContext => {
	const shapes = ref.current?.getLayer('main')?.shapes
	if (!shapes || shapes.size !== 1) {
		throw new Error(`Expected exactly one registered shape, got ${shapes?.size ?? 0}`)
	}

	const shape = shapes.values().next().value
	if (!shape) {
		throw new Error('Registered shape not found')
	}

	return shape
}

type ShapeRerenderCase = {
	name: string
	initial: ReactNode
	updated: ReactNode
	initialMeta: Readonly<Record<string, unknown>>
	updatedMeta: Readonly<Record<string, unknown>>
}

const initialPathCommands = [
	{ type: 'moveTo' as const, x: 1, y: 2 },
	{ type: 'lineTo' as const, x: 10, y: 20 },
]
const updatedPathCommands = [
	{ type: 'moveTo' as const, x: 3, y: 4 },
	{ type: 'lineTo' as const, x: 30, y: 40 },
	{ type: 'closePath' as const },
]
const initialPolygonPoints = [
	{ x: 0, y: 0 },
	{ x: 10, y: 0 },
	{ x: 5, y: 10 },
]
const updatedPolygonPoints = [
	{ x: 2, y: 3 },
	{ x: 22, y: 3 },
	{ x: 12, y: 18 },
]

const shapeRerenderCases: ShapeRerenderCase[] = [
	{
		name: 'Circle',
		initial: <Circle radius={10} cx={12} cy={13} opacity={0.2} fillColor="red" zIndex={1} />,
		updated: <Circle radius={20} cx={22} cy={23} opacity={0.8} fillColor="blue" zIndex={4} />,
		initialMeta: { radius: 10, cx: 12, cy: 13, fillColor: 'red' },
		updatedMeta: { radius: 20, cx: 22, cy: 23, fillColor: 'blue' },
	},
	{
		name: 'Ellipse',
		initial: (
			<Ellipse radiusX={10} radiusY={5} rotation={0.1} opacity={0.2} fillColor="red" zIndex={1} />
		),
		updated: (
			<Ellipse radiusX={20} radiusY={15} rotation={0.7} opacity={0.8} fillColor="blue" zIndex={4} />
		),
		initialMeta: { radiusX: 10, radiusY: 5, rotation: 0.1, fillColor: 'red' },
		updatedMeta: { radiusX: 20, radiusY: 15, rotation: 0.7, fillColor: 'blue' },
	},
	{
		name: 'Image',
		initial: (
			<Image src="/initial.png" x={1} y={2} width={10} height={20} opacity={0.2} zIndex={1} />
		),
		updated: (
			<Image src="/updated.png" x={3} y={4} width={30} height={40} opacity={0.8} zIndex={4} />
		),
		initialMeta: { src: '/initial.png', x: 1, y: 2, width: 10, height: 20 },
		updatedMeta: { src: '/updated.png', x: 3, y: 4, width: 30, height: 40 },
	},
	{
		name: 'Line',
		initial: <Line x1={1} y1={2} x2={10} y2={20} opacity={0.2} strokeColor="red" zIndex={1} />,
		updated: <Line x1={3} y1={4} x2={30} y2={40} opacity={0.8} strokeColor="blue" zIndex={4} />,
		initialMeta: { x1: 1, y1: 2, x2: 10, y2: 20, strokeColor: 'red' },
		updatedMeta: { x1: 3, y1: 4, x2: 30, y2: 40, strokeColor: 'blue' },
	},
	{
		name: 'Path',
		initial: <Path commands={initialPathCommands} opacity={0.2} strokeColor="red" zIndex={1} />,
		updated: <Path commands={updatedPathCommands} opacity={0.8} strokeColor="blue" zIndex={4} />,
		initialMeta: { commands: initialPathCommands, strokeColor: 'red' },
		updatedMeta: { commands: updatedPathCommands, strokeColor: 'blue' },
	},
	{
		name: 'Polygon',
		initial: (
			<Polygon
				points={initialPolygonPoints}
				closed={false}
				opacity={0.2}
				strokeColor="red"
				zIndex={1}
			/>
		),
		updated: (
			<Polygon points={updatedPolygonPoints} closed opacity={0.8} strokeColor="blue" zIndex={4} />
		),
		initialMeta: {
			points: initialPolygonPoints,
			closed: false,
			strokeColor: 'red',
		},
		updatedMeta: {
			points: updatedPolygonPoints,
			closed: true,
			strokeColor: 'blue',
		},
	},
	{
		name: 'Rect',
		initial: <Rect x={1} y={2} width={10} height={20} opacity={0.2} fillColor="red" zIndex={1} />,
		updated: <Rect x={3} y={4} width={30} height={40} opacity={0.8} fillColor="blue" zIndex={4} />,
		initialMeta: { x: 1, y: 2, width: 10, height: 20, fillColor: 'red' },
		updatedMeta: { x: 3, y: 4, width: 30, height: 40, fillColor: 'blue' },
	},
	{
		name: 'Text',
		initial: (
			<Text
				x={1}
				y={2}
				text="initial"
				font="12px serif"
				textAlign="start"
				opacity={0.2}
				fillColor="red"
				zIndex={1}
			/>
		),
		updated: (
			<Text
				x={3}
				y={4}
				text="updated"
				font="20px sans-serif"
				textAlign="center"
				opacity={0.8}
				fillColor="blue"
				zIndex={4}
			/>
		),
		initialMeta: {
			x: 1,
			y: 2,
			text: 'initial',
			font: '12px serif',
			textAlign: 'start',
		},
		updatedMeta: {
			x: 3,
			y: 4,
			text: 'updated',
			font: '20px sans-serif',
			textAlign: 'center',
		},
	},
]

type StrokeShapeCase = {
	name: string
	renderShape: (updated: boolean) => ReactNode
}

const strokeProps = (updated: boolean) => ({
	strokeColor: 'black',
	lineWidth: 2,
	lineCap: updated ? ('round' as const) : ('butt' as const),
	lineJoin: updated ? ('bevel' as const) : ('miter' as const),
	lineDash: updated ? [4, 2] : [1, 1],
	lineDashOffset: updated ? 3 : 0,
})

const strokeShapeCases: StrokeShapeCase[] = [
	{
		name: 'Circle',
		renderShape: updated => <Circle radius={10} {...strokeProps(updated)} />,
	},
	{
		name: 'Ellipse',
		renderShape: updated => <Ellipse radiusX={10} radiusY={5} {...strokeProps(updated)} />,
	},
	{
		name: 'Line',
		renderShape: updated => <Line x1={0} y1={0} x2={10} y2={10} {...strokeProps(updated)} />,
	},
	{
		name: 'Path',
		renderShape: updated => <Path commands={initialPathCommands} {...strokeProps(updated)} />,
	},
	{
		name: 'Polygon',
		renderShape: updated => <Polygon points={initialPolygonPoints} {...strokeProps(updated)} />,
	},
	{
		name: 'Rect',
		renderShape: updated => <Rect width={10} height={10} {...strokeProps(updated)} />,
	},
	{
		name: 'Text',
		renderShape: updated => <Text text="Canvasify" {...strokeProps(updated)} />,
	},
]

const renderShapeScene = (ref: React.RefObject<CanvasRefExpose | null>, shape: ReactNode) => (
	<Canvas ref={ref} width={200} height={100}>
		<Layer name="main">{shape}</Layer>
	</Canvas>
)

describe('canvasify-react shape rerenders', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'devicePixelRatio', {
			value: 1,
			configurable: true,
		})
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn(() => 1),
		)
		vi.stubGlobal('cancelAnimationFrame', vi.fn())
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
			createMock2dContext(),
		)
	})

	afterEach(() => {
		cleanup()
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it.each(shapeRerenderCases)(
		'updates $name constructor props after rerender',
		({ initial, updated, initialMeta, updatedMeta }) => {
			const ref = createRef<CanvasRefExpose>()
			const view = render(renderShapeScene(ref, initial))

			const initialShape = getOnlyShape(ref)
			expect(initialShape.meta).toMatchObject(initialMeta)
			expect(initialShape.shapeParams).toEqual({ opacity: 0.2, zIndex: 1 })

			view.rerender(renderShapeScene(ref, updated))

			const updatedShape = getOnlyShape(ref)
			expect(updatedShape).not.toBe(initialShape)
			expect(updatedShape.meta).toMatchObject(updatedMeta)
			expect(updatedShape.shapeParams).toEqual({ opacity: 0.8, zIndex: 4 })
		},
	)

	it.each(strokeShapeCases)(
		'updates every $name stroke-style prop after rerender',
		({ renderShape }) => {
			const ref = createRef<CanvasRefExpose>()
			const view = render(renderShapeScene(ref, renderShape(false)))

			view.rerender(renderShapeScene(ref, renderShape(true)))

			const ctx = createMock2dContext()
			getOnlyShape(ref).draw(ctx)

			expect(ctx.lineCap).toBe('round')
			expect(ctx.lineJoin).toBe('bevel')
			expect(ctx.setLineDash).toHaveBeenCalledWith([4, 2])
			expect(ctx.lineDashOffset).toBe(3)
		},
	)

	it('updates drawing effects without recreating an incomplete dependency list', () => {
		const ref = createRef<CanvasRefExpose>()
		const view = render(
			renderShapeScene(
				ref,
				<Rect
					width={10}
					height={10}
					shadowColor="red"
					shadowBlur={1}
					shadowOffsetX={2}
					shadowOffsetY={3}
					globalCompositeOperation="source-over"
				/>,
			),
		)

		view.rerender(
			renderShapeScene(
				ref,
				<Rect
					width={10}
					height={10}
					shadowColor="blue"
					shadowBlur={4}
					shadowOffsetX={5}
					shadowOffsetY={6}
					globalCompositeOperation="multiply"
				/>,
			),
		)

		expect(getOnlyShape(ref)).toMatchObject({
			shadowColor: 'blue',
			shadowBlur: 4,
			shadowOffsetX: 5,
			shadowOffsetY: 6,
			globalCompositeOperation: 'multiply',
		})
	})

	it('updates hitStrokeWidth without recreating an image shape', () => {
		let imageInstances = 0
		class CountingImage {
			public onload: (() => void) | null = null
			public onerror: (() => void) | null = null
			public naturalWidth = 10
			public naturalHeight = 10

			public constructor() {
				imageInstances += 1
			}

			public set src(_value: string) {}
		}
		vi.stubGlobal('Image', CountingImage)

		const ref = createRef<CanvasRefExpose>()
		const view = render(
			renderShapeScene(ref, <Image src="/stable.png" width={10} height={10} hitStrokeWidth={2} />),
		)

		expect(imageInstances).toBe(1)
		expect(getOnlyShape(ref).hitStrokeWidth).toBe(2)

		view.rerender(
			renderShapeScene(ref, <Image src="/stable.png" width={10} height={10} hitStrokeWidth={8} />),
		)

		expect(imageInstances).toBe(1)
		expect(getOnlyShape(ref).hitStrokeWidth).toBe(8)
	})
})
