<template>
	<div style="padding: 24px">
		<h1>Canvasify Vue — Dev Playground</h1>
		<button type="button" style="margin-bottom: 16px; padding: 8px 16px" @click="handleExport">
			Экспорт PNG
		</button>

		<Canvas ref="canvasRef" :width="600" :height="400" background="#f0f0f0">
			<Layer name="shapes">
				<Rect :x="20" :y="20" :width="100" :height="80" fill-color="#3b82f6" />
				<Circle :cx="200" :cy="100" :radius="50" fill-color="#ef4444" />
				<Ellipse :cx="350" :cy="100" :radius-x="60" :radius-y="40" fill-color="#22c55e" />
				<Line :x1="450" :y1="50" :x2="550" :y2="150" stroke-color="#8b5cf6" :line-width="4" />
				<Polygon
					:points="[
						{ x: 300, y: 250 },
						{ x: 350, y: 350 },
						{ x: 250, y: 350 },
					]"
					fill-color="#f59e0b"
				/>
				<Transform :translate="{ translateX: 100, translateY: 280 }">
					<Text text="Hello Canvasify" :x="0" :y="0" fill-color="#1f2937" font="24px system-ui" />
				</Transform>
			</Layer>
		</Canvas>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
} from '@maxxam0n/canvasify-vue'
import type { CanvasRefExpose } from '@maxxam0n/canvasify-vue'

const canvasRef = ref<CanvasRefExpose | null>(null)

function handleExport() {
	const dataUrl = canvasRef.value?.toDataURL()
	if (dataUrl) {
		const a = document.createElement('a')
		a.href = dataUrl
		a.download = 'canvasify-export.png'
		a.click()
	}
}
</script>
