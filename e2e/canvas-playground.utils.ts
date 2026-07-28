import { readFile } from 'node:fs/promises'
import { expect, type Download, type Locator, type Page } from '@playwright/test'

export type Point = {
	x: number
	y: number
}

export type Rect = Point & {
	width: number
	height: number
}

export type Rgba = [red: number, green: number, blue: number, alpha: number]

const PNG_SIGNATURE_BYTES = [137, 80, 78, 71, 13, 10, 26, 10]
const BLUE: Rgba = [59, 130, 246, 255]
const RED: Rgba = [239, 68, 68, 255]
const GREEN: Rgba = [34, 197, 94, 255]
const PURPLE: Rgba = [139, 92, 246, 255]
const ORANGE: Rgba = [245, 158, 11, 255]
const BACKGROUND: Rgba = [240, 240, 240, 255]

export const collectRuntimeErrors = (page: Page): string[] => {
	const errors: string[] = []

	page.on('pageerror', error => {
		errors.push(error.message)
	})
	page.on('console', message => {
		if (message.type() === 'error') {
			errors.push(message.text())
		}
	})

	return errors
}

export const readCanvasPixel = async (canvas: Locator, point: Point): Promise<Rgba> => {
	return canvas.evaluate((element, target): Rgba => {
		if (!(element instanceof HTMLCanvasElement)) {
			throw new Error('Expected a canvas element')
		}
		const context = element.getContext('2d')
		if (!context) {
			throw new Error('Canvas 2D context is unavailable')
		}

		const bounds = element.getBoundingClientRect()
		if (bounds.width <= 0 || bounds.height <= 0 || element.width <= 0 || element.height <= 0) {
			throw new Error('Canvas has an invalid surface size')
		}

		const x = Math.min(
			element.width - 1,
			Math.max(0, Math.floor((target.x / bounds.width) * element.width)),
		)
		const y = Math.min(
			element.height - 1,
			Math.max(0, Math.floor((target.y / bounds.height) * element.height)),
		)
		const pixel = context.getImageData(x, y, 1, 1).data

		return [pixel[0], pixel[1], pixel[2], pixel[3]]
	}, point)
}

export const expectCanvasPixel = async (
	canvas: Locator,
	point: Point,
	expected: Rgba,
): Promise<void> => {
	await expect.poll(() => readCanvasPixel(canvas, point)).toEqual(expected)
}

export const countOpaqueCanvasPixels = async (canvas: Locator, region: Rect): Promise<number> => {
	return canvas.evaluate((element, target): number => {
		if (!(element instanceof HTMLCanvasElement)) {
			throw new Error('Expected a canvas element')
		}
		const context = element.getContext('2d')
		if (!context) {
			throw new Error('Canvas 2D context is unavailable')
		}

		const bounds = element.getBoundingClientRect()
		if (bounds.width <= 0 || bounds.height <= 0 || element.width <= 0 || element.height <= 0) {
			throw new Error('Canvas has an invalid surface size')
		}

		const scaleX = element.width / bounds.width
		const scaleY = element.height / bounds.height
		const x = Math.max(0, Math.floor(target.x * scaleX))
		const y = Math.max(0, Math.floor(target.y * scaleY))
		const width = Math.min(element.width - x, Math.max(1, Math.ceil(target.width * scaleX)))
		const height = Math.min(element.height - y, Math.max(1, Math.ceil(target.height * scaleY)))
		const pixels = context.getImageData(x, y, width, height).data
		let opaquePixels = 0

		for (let index = 3; index < pixels.length; index += 4) {
			if (pixels[index] > 0) {
				opaquePixels += 1
			}
		}

		return opaquePixels
	}, region)
}

export const readDownloadedPng = async (
	download: Download,
	expectedFilename: string,
	expectedSize: { width: number; height: number },
): Promise<Buffer> => {
	expect(download.suggestedFilename()).toBe(expectedFilename)

	const downloadPath = await download.path()
	if (!downloadPath) {
		throw new Error('Playwright did not expose the downloaded PNG path')
	}

	const png = await readFile(downloadPath)
	expect(Array.from(png.subarray(0, PNG_SIGNATURE_BYTES.length))).toEqual(PNG_SIGNATURE_BYTES)
	expect(png.readUInt32BE(16)).toBe(expectedSize.width)
	expect(png.readUInt32BE(20)).toBe(expectedSize.height)

	return png
}

export const readPngPixel = async (page: Page, png: Buffer, point: Point): Promise<Rgba> => {
	const source = `data:image/png;base64,${png.toString('base64')}`

	return page.evaluate(
		async ({ imageSource, target }): Promise<Rgba> => {
			const image = new Image()
			image.src = imageSource
			await image.decode()

			const canvas = document.createElement('canvas')
			canvas.width = image.naturalWidth
			canvas.height = image.naturalHeight
			const context = canvas.getContext('2d')
			if (!context) {
				throw new Error('Canvas 2D context is unavailable while decoding the PNG')
			}

			context.drawImage(image, 0, 0)
			const pixel = context.getImageData(target.x, target.y, 1, 1).data

			return [pixel[0], pixel[1], pixel[2], pixel[3]]
		},
		{ imageSource: source, target: point },
	)
}

export const verifyCanvasPlayground = async (
	page: Page,
	options: { url: string; headingName: string | RegExp },
): Promise<void> => {
	const runtimeErrors = collectRuntimeErrors(page)
	await page.goto(options.url)

	await expect(page.getByRole('heading', { name: options.headingName })).toBeVisible()

	const canvas = page.locator('canvas')
	await expect(canvas).toHaveCount(1)
	await expect(canvas).toHaveCSS('width', '600px')
	await expect(canvas).toHaveCSS('height', '400px')

	await expectCanvasPixel(canvas, { x: 10, y: 10 }, [0, 0, 0, 0])
	await expectCanvasPixel(canvas, { x: 40, y: 40 }, BLUE)
	await expectCanvasPixel(canvas, { x: 200, y: 100 }, RED)
	await expectCanvasPixel(canvas, { x: 350, y: 100 }, GREEN)
	await expectCanvasPixel(canvas, { x: 500, y: 100 }, PURPLE)
	await expectCanvasPixel(canvas, { x: 300, y: 300 }, ORANGE)
	await expect
		.poll(() => countOpaqueCanvasPixels(canvas, { x: 100, y: 245, width: 140, height: 45 }))
		.toBeGreaterThan(20)

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button').click(),
	])
	const png = await readDownloadedPng(download, 'canvasify-export.png', {
		width: 600,
		height: 400,
	})

	expect(await readPngPixel(page, png, { x: 40, y: 40 })).toEqual(BLUE)
	expect(await readPngPixel(page, png, { x: 500, y: 300 })).toEqual(BACKGROUND)
	expect(runtimeErrors).toEqual([])
}
