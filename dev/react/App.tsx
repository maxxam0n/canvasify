import { useRef } from 'react'
import {
	Canvas,
	Layer,
	Rect,
	Circle,
	Line,
	Text,
	Ellipse,
	Polygon,
	Transform,
	type CanvasRefExpose,
} from '@maxxam0n/canvasify-react'

export function App() {
	const canvasRef = useRef<CanvasRefExpose>(null)

	const handleExport = () => {
		const dataUrl = canvasRef.current?.toDataURL()
		if (dataUrl) {
			const a = document.createElement('a')
			a.href = dataUrl
			a.download = 'canvasify-export.png'
			a.click()
		}
	}

	return (
		<div style={{ padding: 24 }}>
			<h1>Canvasify React — Dev Playground</h1>
			<button
				type="button"
				onClick={handleExport}
				style={{ marginBottom: 16, padding: '8px 16px' }}
			>
				Экспорт PNG
			</button>

			<Canvas ref={canvasRef} width={600} height={400} background="#f0f0f0">
				<Layer name="shapes">
					<Rect x={20} y={20} width={100} height={80} fillColor="#3b82f6" />
					<Circle cx={200} cy={100} radius={50} fillColor="#ef4444" />
					<Ellipse cx={350} cy={100} radiusX={60} radiusY={40} fillColor="#22c55e" />
					<Line x1={450} y1={50} x2={550} y2={150} strokeColor="#8b5cf6" lineWidth={4} />
					<Polygon
						points={[
							{ x: 300, y: 250 },
							{ x: 350, y: 350 },
							{ x: 250, y: 350 },
						]}
						fillColor="#f59e0b"
					/>
					<Transform translate={{ translateX: 100, translateY: 280 }}>
						<Text text="Hello Canvasify" x={0} y={0} fillColor="#1f2937" font="24px system-ui" />
					</Transform>
				</Layer>
			</Canvas>
		</div>
	)
}
