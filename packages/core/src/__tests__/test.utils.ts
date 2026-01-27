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
	} satisfies Partial<MockContext2D>

	return { ctx: ctx as unknown as MockContext2D, calls }
}

export const createMockCanvas = (ctxOverride?: MockContext2D): MockCanvasFactoryResult => {
	const { ctx, calls } = ctxOverride ? { ctx: ctxOverride, calls: [] } : createMockContext()

	const toDataURL = vi.fn(() => 'data:image/png;base64,stub')
	const toBlob = vi.fn((callback: BlobCallback) => {
		callback(new Blob(['stub'], { type: 'image/png' }))
	})

	const style = { width: '', height: '' } as unknown as CSSStyleDeclaration

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
