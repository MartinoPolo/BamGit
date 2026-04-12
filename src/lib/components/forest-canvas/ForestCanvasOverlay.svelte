<script lang="ts">
	import type { TreeVisualization } from '$lib/types/tree_visualization';
	import {
		POOL_SIZE,
		LEAF_CONFIG,
		RAIN_CONFIG,
		FIREFLY_CONFIG,
		type ParticleConfig,
		type ParticleKind,
	} from './particle_types';
	import { create_particle_pool, acquire, release } from './particle_pool';
	import {
		initialize_particle,
		update_particles,
		compute_spawn_count,
		type Viewport,
	} from './particle_system';
	import { draw_particles } from './particle_renderer';
	import { derive_weather } from './weather_state';

	interface Props {
		visualizations: readonly TreeVisualization[];
		is_dark: boolean;
		viewport_width: number;
		viewport_height: number;
	}

	let { visualizations, is_dark, viewport_width, viewport_height }: Props = $props();

	let canvas_element = $state<HTMLCanvasElement | null>(null);

	const pool = create_particle_pool(POOL_SIZE);

	// Reading `weather.*` and `is_dark` inside the rAF tick is safe: Svelte 5
	// props and $derived values are live references, not snapshots captured at
	// closure creation time.
	const weather = $derived(derive_weather(visualizations, is_dark));

	interface SpawnAccumulator {
		remainder: number;
	}

	$effect(() => {
		if (canvas_element === null) {
			return;
		}
		if (viewport_width <= 0 || viewport_height <= 0) {
			return;
		}
		const canvas = canvas_element;
		const ctx = canvas.getContext('2d');
		if (ctx === null) {
			return;
		}

		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.floor(viewport_width * dpr);
		canvas.height = Math.floor(viewport_height * dpr);
		canvas.style.width = `${viewport_width}px`;
		canvas.style.height = `${viewport_height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		// Drain any particles that belonged to a previous viewport size so a
		// resize does not leave stray particles at stale coordinates.
		for (const slot of pool.slots) {
			release(slot);
		}

		const viewport: Viewport = { width: viewport_width, height: viewport_height };
		const leaf_accumulator: SpawnAccumulator = { remainder: 0 };
		const rain_accumulator: SpawnAccumulator = { remainder: 0 };
		const firefly_accumulator: SpawnAccumulator = { remainder: 0 };
		let last_timestamp: number | null = null;
		let frame_handle = 0;

		function spawn_kind(
			kind: ParticleKind,
			config: ParticleConfig,
			accumulator: SpawnAccumulator,
			delta_ms: number,
		): void {
			const result = compute_spawn_count(
				config.spawnRatePerSecond,
				delta_ms,
				accumulator.remainder,
			);
			accumulator.remainder = result.remainder;
			for (let i = 0; i < result.count; i++) {
				const particle = acquire(pool);
				if (particle === null) {
					break;
				}
				initialize_particle(particle, kind, viewport, Math.random);
			}
		}

		const tick = (timestamp: number) => {
			const delta_ms =
				last_timestamp === null ? 16 : Math.min(timestamp - last_timestamp, 100);
			last_timestamp = timestamp;

			if (weather.leaves) {
				spawn_kind('leaf', LEAF_CONFIG, leaf_accumulator, delta_ms);
			}
			if (weather.rain) {
				spawn_kind('rain', RAIN_CONFIG, rain_accumulator, delta_ms);
			}
			if (weather.fireflies) {
				spawn_kind('firefly', FIREFLY_CONFIG, firefly_accumulator, delta_ms);
			}

			update_particles(pool, delta_ms, viewport);

			ctx.clearRect(0, 0, viewport_width, viewport_height);
			draw_particles(ctx, pool, is_dark);

			frame_handle = requestAnimationFrame(tick);
		};

		frame_handle = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(frame_handle);
		};
	});
</script>

<canvas bind:this={canvas_element} class="pointer-events-none absolute inset-0" aria-hidden="true"
></canvas>
