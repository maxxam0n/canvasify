import { test } from '@playwright/test'

import { verifyCanvasPlayground } from './canvas-playground.utils'

const CORE_PLAYGROUND_URL = 'http://127.0.0.1:5175'

test('Core fixture renders every demo primitive and exports the composed PNG', async ({ page }) => {
	await verifyCanvasPlayground(page, {
		url: CORE_PLAYGROUND_URL,
		headingName: /Canvasify Core/,
	})
})
