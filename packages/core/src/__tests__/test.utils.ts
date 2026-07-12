import { vi } from 'vitest'

import type {
	MockCall,
	MockCanvasFactoryResult,
	MockContext2D,
	MockContextFactoryResult,
	MockDocument,
} from './test.types'

const createRecordedFn = (name: string, calls: MockCall[]) =>
	vi.fn((...args: unknown[]) => {
		calls.push({ name, args })
	})

export const createMockContext = (): MockContextFactoryResult => {
	const calls: MockCall[] = []

	const ctx = {
		globalAlpha: 1,
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 1,
		imageSmoothingEnabled: true,
		font: '',
		textAlign: 'start',
		textBaseline: 'alphabetic',
		direction: 'inherit',
		save: createRecordedFn('save', calls),
		restore: createRecordedFn('restore', calls),
		clearRect: createRecordedFn('clearRect', calls),
		drawImage: createRecordedFn('drawImage', calls),
		fillRect: createRecordedFn('fillRect', calls),
		strokeRect: createRecordedFn('strokeRect', calls),
		beginPath: createRecordedFn('beginPath', calls),
		ellipse: createRecordedFn('ellipse', calls),
		arc: createRecordedFn('arc', calls),
		closePath: createRecordedFn('closePath', calls),
		fill: createRecordedFn('fill', calls),
		stroke: createRecordedFn('stroke', calls),
		moveTo: createRecordedFn('moveTo', calls),
		lineTo: createRecordedFn('lineTo', calls),
		translate: createRecordedFn('translate', calls),
		scale: createRecordedFn('scale', calls),
		rotate: createRecordedFn('rotate', calls),
		setTransform: createRecordedFn('setTransform', calls),
		fillText: createRecordedFn('fillText', calls),
		strokeText: createRecordedFn('strokeText', calls),
		measureText: vi.fn((text: string): TextMetrics => {
			calls.push({ name: 'measureText', args: [text] })
			const width = text.length * 10
			return {
				width,
				actualBoundingBoxAscent: 12,
				actualBoundingBoxDescent: 4,
				actualBoundingBoxLeft: 0,
				actualBoundingBoxRight: width,
				fontBoundingBoxAscent: 12,
				fontBoundingBoxDescent: 4,
				alphabeticBaseline: 0,
				emHeightAscent: 12,
				emHeightDescent: 4,
				hangingBaseline: 0,
				ideographicBaseline: 0,
			}
		}),
		rect: createRecordedFn('rect', calls),
		clip: createRecordedFn('clip', calls),
		createLinearGradient: vi.fn((x0: number, y0: number, x1: number, y1: number) => {
			calls.push({ name: 'createLinearGradient', args: [x0, y0, x1, y1] })
			return {
				addColorStop: vi.fn(),
			}
		}),
		createRadialGradient: vi.fn(
			(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
				calls.push({ name: 'createRadialGradient', args: [x0, y0, r0, x1, y1, r1] })
				return {
					addColorStop: vi.fn(),
				}
			},
		),
		bezierCurveTo: createRecordedFn('bezierCurveTo', calls),
		quadraticCurveTo: createRecordedFn('quadraticCurveTo', calls),
	} satisfies Partial<MockContext2D>

	return { ctx: ctx as unknown as MockContext2D, calls }
}

export const createMockCanvas = (ctxOverride?: MockContext2D): MockCanvasFactoryResult => {
	const { ctx, calls } = ctxOverride ? { ctx: ctxOverride, calls: [] } : createMockContext()

	const toDataURL = vi.fn(() => 'data:image/png;base64,stub')
	const toBlob = vi.fn((callback: BlobCallback) => {
		callback(new Blob(['stub'], { type: 'image/png' }))
	})

	const style = { width: '', height: '', opacity: '', zIndex: '' } as unknown as CSSStyleDeclaration

	const getContext = vi.fn(() => ctx) as unknown as HTMLCanvasElement['getContext']

	const canvas = {
		width: 0,
		height: 0,
		style,
		getContext,
		toDataURL,
		toBlob,
	} satisfies Partial<HTMLCanvasElement>

	return { canvas: canvas as unknown as HTMLCanvasElement, ctx, calls }
}

export const createMockDocument = (createCanvas: () => MockCanvasFactoryResult): MockDocument =>
	({
		createElement: vi.fn((tagName: string) => {
			if (tagName !== 'canvas') {
				throw new Error(`unsupported element: ${tagName}`)
			}
			return createCanvas().canvas
		}),
	}) satisfies MockDocument
