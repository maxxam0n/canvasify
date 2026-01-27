export type MockCall = {
	name: string
	args: unknown[]
}

export type MockContext2D = CanvasRenderingContext2D
export type MockCanvas = HTMLCanvasElement

export type MockContextFactoryResult = {
	ctx: MockContext2D
	calls: MockCall[]
}

export type MockCanvasFactoryResult = {
	canvas: MockCanvas
	ctx: MockContext2D
	calls: MockCall[]
}

export type MockDocument = Pick<Document, 'createElement'>
