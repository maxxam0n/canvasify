import { test } from '@playwright/test'

import { verifyCanvasPlayground } from './canvas-playground.utils'

const REACT_PLAYGROUND_URL = 'http://127.0.0.1:5173'

test('React fixture renders every demo primitive and exports the composed PNG', async ({
	page,
}) => {
	await verifyCanvasPlayground(page, {
		url: REACT_PLAYGROUND_URL,
		headingName: /Canvasify React/,
	})
})
