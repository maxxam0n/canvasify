import { expect, test, type Locator } from '@playwright/test'

import {
	collectRuntimeErrors,
	expectCanvasPixel,
	readDownloadedPng,
	readPngPixel,
} from './canvas-playground.utils'

type ViewportStyle = {
	left: string
	top: string
	width: string
	height: string
}

const expectViewportStyle = async (canvas: Locator, expected: ViewportStyle): Promise<void> => {
	await expect(canvas).toHaveCSS('position', 'absolute')
	await expect(canvas).toHaveCSS('left', expected.left)
	await expect(canvas).toHaveCSS('top', expected.top)
	await expect(canvas).toHaveCSS('width', expected.width)
	await expect(canvas).toHaveCSS('height', expected.height)
}

test('Vue fixture supports viewport layers, interaction, reactive props and PNG export', async ({
	page,
}) => {
	const runtimeErrors = collectRuntimeErrors(page)
	await page.goto('/')

	const canvasFixture = page.getByTestId('canvas-fixture')
	const backgroundCanvas = page.getByTestId('background-layer').locator('canvas')
	const contentCanvas = page.getByTestId('content-layer').locator('canvas')

	await expect(canvasFixture.locator('canvas')).toHaveCount(2)
	await expect(canvasFixture).toHaveCSS('position', 'relative')

	const initialViewport = {
		left: '80px',
		top: '40px',
		width: '360px',
		height: '240px',
	}
	await expectViewportStyle(backgroundCanvas, initialViewport)
	await expectViewportStyle(contentCanvas, initialViewport)
	await expectCanvasPixel(backgroundCanvas, { x: 10, y: 10 }, [219, 234, 254, 255])
	await expectCanvasPixel(contentCanvas, { x: 10, y: 10 }, [0, 0, 0, 0])
	await expectCanvasPixel(contentCanvas, { x: 80, y: 80 }, [37, 99, 235, 255])

	await canvasFixture.click({ position: { x: 180, y: 130 } })
	await expect(page.getByTestId('status')).toContainText('Shape click #1: content')

	await page.getByTestId('runtime-props-button').click()
	await expect(page.getByTestId('runtime-state')).toHaveText('Layout: updated')

	const updatedViewport = {
		left: '120px',
		top: '70px',
		width: '300px',
		height: '200px',
	}
	await expectViewportStyle(backgroundCanvas, updatedViewport)
	await expectViewportStyle(contentCanvas, updatedViewport)
	await expectCanvasPixel(contentCanvas, { x: 80, y: 60 }, [124, 58, 237, 255])

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByTestId('export-button').click(),
	])
	const png = await readDownloadedPng(download, 'canvasify-vue-fixture.png', {
		width: 600,
		height: 400,
	})
	expect(await readPngPixel(page, png, { x: 200, y: 120 })).toEqual([124, 58, 237, 255])
	expect(await readPngPixel(page, png, { x: 500, y: 300 })).toEqual([219, 234, 254, 255])
	await expect(page.getByTestId('status')).toHaveText('PNG export started')
	expect(runtimeErrors).toEqual([])
})
