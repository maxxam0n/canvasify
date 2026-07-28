/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

import { Canvas, Image, Layer } from '../index'

describe('canvasify-vue SSR', () => {
	it('does not construct DOM-backed shapes before a layer canvas is mounted', async () => {
		const App = defineComponent({
			setup() {
				return () =>
					h(
						Canvas,
						{ width: 200, height: 100 },
						{
							default: () =>
								h(
									Layer,
									{ name: 'main' },
									{
										default: () =>
											h(Image, {
												src: '/image.png',
												width: 20,
												height: 20,
											}),
									},
								),
						},
					)
			},
		})

		await expect(renderToString(h(App))).resolves.toContain('<canvas')
	})
})
