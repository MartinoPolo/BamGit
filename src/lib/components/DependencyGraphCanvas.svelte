<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		contentWidth: number;
		contentHeight: number;
		minScale?: number;
		maxScale?: number;
		padding?: number;
		fitKey?: string | number;
		content: Snippet<[transformInfo: { scale: number }]>;
	}

	let {
		contentWidth,
		contentHeight,
		minScale = 0.2,
		maxScale = 4,
		padding = 40,
		fitKey,
		content,
	}: Props = $props();

	let containerEl: HTMLDivElement | null = $state(null);
	let viewportWidth = $state(800);
	let viewportHeight = $state(400);

	let scale = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);

	let isPanning = $state(false);
	let panStartClientX = 0;
	let panStartClientY = 0;
	let panStartTx = 0;
	let panStartTy = 0;

	let lastFitKey: string | number | undefined = undefined;

	function fitContent() {
		if (contentWidth <= 0 || contentHeight <= 0) {
			scale = 1;
			translateX = padding;
			translateY = padding;
			return;
		}
		if (viewportWidth <= 0 || viewportHeight <= 0) {
			return;
		}
		const usableWidth = Math.max(viewportWidth - padding * 2, 1);
		const usableHeight = Math.max(viewportHeight - padding * 2, 1);
		const scaleX = usableWidth / contentWidth;
		const scaleY = usableHeight / contentHeight;
		const fittedScale = Math.min(scaleX, scaleY, 1);
		scale = Math.max(fittedScale, minScale);
		translateX = (viewportWidth - contentWidth * scale) / 2;
		translateY = (viewportHeight - contentHeight * scale) / 2;
	}

	$effect(() => {
		if (containerEl === null) {
			return;
		}
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				viewportWidth = entry.contentRect.width;
				viewportHeight = entry.contentRect.height;
			}
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	function isReadyToFit(): boolean {
		return contentWidth > 0 && contentHeight > 0 && viewportWidth > 0 && viewportHeight > 0;
	}

	$effect(() => {
		if (!isReadyToFit()) {
			return;
		}
		if (fitKey !== lastFitKey) {
			lastFitKey = fitKey;
			fitContent();
		}
	});

	function clampScale(value: number): number {
		return Math.min(Math.max(value, minScale), maxScale);
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const rect = containerEl?.getBoundingClientRect();
		if (rect === undefined) {
			return;
		}
		const cursorX = event.clientX - rect.left;
		const cursorY = event.clientY - rect.top;
		const worldX = (cursorX - translateX) / scale;
		const worldY = (cursorY - translateY) / scale;
		const direction = event.deltaY < 0 ? 1 : -1;
		const factor = 1 + direction * 0.12;
		const next = clampScale(scale * factor);
		if (next === scale) {
			return;
		}
		scale = next;
		translateX = cursorX - worldX * scale;
		translateY = cursorY - worldY * scale;
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.button !== 0) {
			return;
		}
		const target = event.target as Element | null;
		if (target?.closest('[data-dep-node="true"]') !== null) {
			return;
		}
		isPanning = true;
		panStartClientX = event.clientX;
		panStartClientY = event.clientY;
		panStartTx = translateX;
		panStartTy = translateY;
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isPanning) {
			return;
		}
		translateX = panStartTx + (event.clientX - panStartClientX);
		translateY = panStartTy + (event.clientY - panStartClientY);
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isPanning) {
			return;
		}
		isPanning = false;
		(event.currentTarget as Element).releasePointerCapture(event.pointerId);
	}

	function zoomIn() {
		const next = clampScale(scale * 1.25);
		const cx = viewportWidth / 2;
		const cy = viewportHeight / 2;
		const worldX = (cx - translateX) / scale;
		const worldY = (cy - translateY) / scale;
		scale = next;
		translateX = cx - worldX * scale;
		translateY = cy - worldY * scale;
	}

	function zoomOut() {
		const next = clampScale(scale / 1.25);
		const cx = viewportWidth / 2;
		const cy = viewportHeight / 2;
		const worldX = (cx - translateX) / scale;
		const worldY = (cy - translateY) / scale;
		scale = next;
		translateX = cx - worldX * scale;
		translateY = cy - worldY * scale;
	}

	function resetView() {
		fitContent();
	}
</script>

<div
	bind:this={containerEl}
	class="dep-canvas"
	class:panning={isPanning}
	role="presentation"
	onwheel={handleWheel}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
>
	<svg
		class="dep-canvas-svg"
		width={viewportWidth}
		height={viewportHeight}
		viewBox="0 0 {viewportWidth} {viewportHeight}"
		preserveAspectRatio="xMinYMin meet"
	>
		<g transform="translate({translateX} {translateY}) scale({scale})">
			{@render content({ scale })}
		</g>
	</svg>

	<div class="dep-canvas-controls">
		<button
			type="button"
			onclick={zoomIn}
			aria-label="Zoom in"
			title="Zoom in"
			class="dep-canvas-control"
		>
			+
		</button>
		<button
			type="button"
			onclick={zoomOut}
			aria-label="Zoom out"
			title="Zoom out"
			class="dep-canvas-control"
		>
			−
		</button>
		<button
			type="button"
			onclick={resetView}
			aria-label="Reset view"
			title="Reset view"
			class="dep-canvas-control"
		>
			⤧
		</button>
	</div>

	<div class="dep-canvas-zoom-readout">{Math.round(scale * 100)}%</div>
</div>

<style>
	.dep-canvas {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: grab;
		background: var(--background);
		touch-action: none;
		user-select: none;
	}

	.dep-canvas.panning {
		cursor: grabbing;
	}

	.dep-canvas-svg {
		display: block;
	}

	.dep-canvas-controls {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		z-index: 1;
	}

	.dep-canvas-control {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 0.75);
		background: var(--card);
		color: var(--foreground);
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
		transition: background 150ms ease;
	}

	.dep-canvas-control:hover {
		background: var(--accent);
	}

	.dep-canvas-zoom-readout {
		position: absolute;
		bottom: 8px;
		right: 12px;
		font-size: 11px;
		color: var(--muted-foreground);
		background: color-mix(in oklch, var(--background) 80%, transparent);
		padding: 2px 6px;
		border-radius: calc(var(--radius) * 0.5);
		pointer-events: none;
	}
</style>
