<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import { Canvas, Image as CanvasImage, Layer, Path, Rect, Text } from '@maxxam0n/canvasify-vue'
import type { CanvasRefExpose, ShapePointerEvent } from '@maxxam0n/canvasify-vue'
import type { PathCommand, Rect as CanvasViewport } from '@maxxam0n/canvasify-core'

const INITIAL_VIEWPORT: CanvasViewport = {
	x: 80,
	y: 40,
	width: 360,
	height: 240,
}

const UPDATED_VIEWPORT: CanvasViewport = {
	x: 120,
	y: 70,
	width: 300,
	height: 200,
}

const pathCommands: PathCommand[] = [
	{ type: 'moveTo', x: 290, y: 145 },
	{ type: 'quadraticCurveTo', cpx: 335, cpy: 65, x: 380, y: 145 },
	{ type: 'lineTo', x: 355, y: 205 },
	{ type: 'lineTo', x: 315, y: 205 },
	{ type: 'closePath' },
]

const inlineImageSource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
		<rect width="64" height="64" rx="12" fill="#0f172a"/>
		<circle cx="32" cy="32" r="18" fill="#38bdf8"/>
		<path d="M22 34l7 7 14-18" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`)}`

const canvasRef = useTemplateRef<CanvasRefExpose>('canvas')
const useUpdatedProps = shallowRef(false)
const clickCount = shallowRef(0)
const status = shallowRef('Ready')

const viewport = computed<CanvasViewport>(() =>
	useUpdatedProps.value ? UPDATED_VIEWPORT : INITIAL_VIEWPORT,
)
const interactiveRectX = computed(() => (useUpdatedProps.value ? 180 : 140))
const interactiveRectColor = computed(() => (useUpdatedProps.value ? '#7c3aed' : '#2563eb'))
const runtimeState = computed(() => (useUpdatedProps.value ? 'updated' : 'initial'))

const handleShapeClick = (event: ShapePointerEvent): void => {
	clickCount.value += 1
	status.value = `Shape click #${clickCount.value}: ${event.hit.layerName} @ ${Math.round(event.x)},${Math.round(event.y)}`
}

const toggleRuntimeProps = (): void => {
	useUpdatedProps.value = !useUpdatedProps.value
	status.value = `Runtime props: ${runtimeState.value}`
}

const handleExport = (): void => {
	const dataUrl = canvasRef.value?.toDataURL({ type: 'image/png' })
	if (!dataUrl) {
		status.value = 'Canvas is not ready'
		return
	}

	const anchor = document.createElement('a')
	anchor.href = dataUrl
	anchor.download = 'canvasify-vue-fixture.png'
	anchor.hidden = true
	document.body.append(anchor)
	anchor.click()
	anchor.remove()
	status.value = 'PNG export started'
}
</script>

<template>
	<main class="playground">
		<header class="playground-header">
			<p class="eyebrow">Automated browser fixture</p>
			<h1>Canvasify Vue playground</h1>
			<p>Two viewport layers exercise rendering, reactivity, interaction and export.</p>
		</header>

		<section class="toolbar" aria-label="Fixture controls">
			<button data-testid="runtime-props-button" type="button" @click="toggleRuntimeProps">
				Toggle runtime props
			</button>
			<button data-testid="export-button" type="button" @click="handleExport">Export PNG</button>
			<output data-testid="runtime-state">Layout: {{ runtimeState }}</output>
			<output data-testid="status" aria-live="polite">{{ status }}</output>
		</section>

		<section class="canvas-stage" aria-label="Canvas fixture">
			<Canvas
				ref="canvas"
				class="canvas-fixture"
				data-testid="canvas-fixture"
				:width="600"
				:height="400"
				:viewport="viewport"
				:pixel-ratio="1"
				background="#f8fafc"
				@shape-click="handleShapeClick"
			>
				<div class="layer-probe" data-testid="background-layer">
					<Layer name="background" :z-index="1">
						<Rect
							:x="0"
							:y="0"
							:width="600"
							:height="400"
							fill-color="#dbeafe"
							:listening="false"
						/>
						<Text
							text="viewport layer"
							:x="viewport.x + 16"
							:y="viewport.y + 28"
							fill-color="#334155"
							font="16px system-ui"
							:listening="false"
						/>
					</Layer>
				</div>

				<div class="layer-probe" data-testid="content-layer">
					<Layer name="content" :z-index="2">
						<Rect
							:x="interactiveRectX"
							:y="100"
							:width="120"
							:height="70"
							:fill-color="interactiveRectColor"
							cursor="pointer"
						/>
						<Path
							:commands="pathCommands"
							fill-color="#f59e0b"
							stroke-color="#92400e"
							:line-width="4"
							:listening="false"
						/>
						<CanvasImage
							:src="inlineImageSource"
							:x="340"
							:y="210"
							:width="56"
							:height="56"
							:listening="false"
						/>
					</Layer>
				</div>
			</Canvas>
		</section>
	</main>
</template>
