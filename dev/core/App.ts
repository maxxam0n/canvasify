import { Scene } from '@maxxam0n/canvasify-core'

export function initApp(container: HTMLElement): void {
	const wrapper = document.createElement('div')
	wrapper.style.padding = '24px'
	container.appendChild(wrapper)

	const title = document.createElement('h1')
	title.textContent = 'Canvasify Core — Dev Playground'
	wrapper.appendChild(title)

	const exportBtn = document.createElement('button')
	exportBtn.type = 'button'
	exportBtn.textContent = 'Экспорт PNG'
	exportBtn.style.marginBottom = '16px'
	exportBtn.style.padding = '8px 16px'
	wrapper.appendChild(exportBtn)

	const sceneContainer = document.createElement('div')
	wrapper.appendChild(sceneContainer)

	const scene = new Scene(sceneContainer, {
		width: 600,
		height: 400,
		background: '#f0f0f0',
		layers: ['shapes'],
	})

	const layer = scene.getLayer('shapes')
	if (!layer) throw new Error('Layer "shapes" not found')

	layer.rect({ x: 20, y: 20, width: 100, height: 80, fillColor: '#3b82f6' })
	layer.circle({ cx: 200, cy: 100, radius: 50, fillColor: '#ef4444' })
	layer.ellipse({ cx: 350, cy: 100, radiusX: 60, radiusY: 40, fillColor: '#22c55e' })
	layer.line({ x1: 450, y1: 50, x2: 550, y2: 150, strokeColor: '#8b5cf6', lineWidth: 4 })
	layer.polygon({
		points: [
			{ x: 300, y: 250 },
			{ x: 350, y: 350 },
			{ x: 250, y: 350 },
		],
		fillColor: '#f59e0b',
	})
	layer.group({ translate: { translateX: 100, translateY: 280 } }, l => {
		l.text({ text: 'Hello Canvasify', x: 0, y: 0, fillColor: '#1f2937', font: '24px system-ui' })
	})

	scene.requestRender()

	exportBtn.addEventListener('click', () => {
		const dataUrl = scene.toDataURL()
		const a = document.createElement('a')
		a.href = dataUrl
		a.download = 'canvasify-export.png'
		a.click()
	})
}
