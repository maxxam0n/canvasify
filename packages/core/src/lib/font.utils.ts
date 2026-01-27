export const ensureFontIsReady = (font: string) => {
	if (typeof document === 'undefined') return Promise.resolve()
	if (!('fonts' in document)) return Promise.resolve()

	const fontSet = document.fonts
	if (typeof fontSet.load === 'function') {
		return fontSet.load(font).then(() => undefined)
	}

	return fontSet.ready.then(() => undefined)
}
