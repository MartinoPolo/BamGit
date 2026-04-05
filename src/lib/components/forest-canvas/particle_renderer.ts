// ─── Particle Rendering ───────────────────────────────────────────────────
// Low-poly geometric draw routines. Colors match the tree palette aesthetic:
// warm leaves, cool rain, warm fireflies. Kept outside the Svelte component
// so they can be reused from storybook / canvas perf benches.

import type { Particle } from './particle_types';
import type { ParticlePool } from './particle_pool';
import { for_each_alive } from './particle_pool';

const LEAF_BASE_RADIUS = 5;
const RAIN_STROKE_ALPHA = 0.55;
const FIREFLY_GLOW_RADIUS = 10;

export function draw_particles(
	ctx: CanvasRenderingContext2D,
	pool: ParticlePool,
	is_dark: boolean,
): void {
	for_each_alive(pool, (particle) => {
		switch (particle.kind) {
			case 'leaf':
				draw_leaf(ctx, particle, is_dark);
				return;
			case 'rain':
				draw_rain(ctx, particle, is_dark);
				return;
			case 'firefly':
				draw_firefly(ctx, particle);
		}
	});
}

function draw_leaf(ctx: CanvasRenderingContext2D, particle: Particle, is_dark: boolean): void {
	// Angular low-poly leaf: diamond with offset.
	const radius = LEAF_BASE_RADIUS * particle.scale;
	const hue = 20 + particle.extra * 40; // 20° (red-orange) → 60° (yellow)
	const lightness = is_dark ? 45 : 55;
	const life_ratio = 1 - particle.age / particle.lifetime;
	const alpha = Math.min(1, life_ratio * 2);

	ctx.save();
	ctx.translate(particle.x, particle.y);
	ctx.rotate(particle.rotation);
	ctx.fillStyle = `hsla(${hue}, 75%, ${lightness}%, ${alpha})`;
	ctx.beginPath();
	ctx.moveTo(0, -radius);
	ctx.lineTo(radius * 0.7, 0);
	ctx.lineTo(0, radius);
	ctx.lineTo(-radius * 0.7, 0);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function draw_rain(ctx: CanvasRenderingContext2D, particle: Particle, is_dark: boolean): void {
	const length = particle.extra;
	// Draw along velocity vector.
	const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
	const nx = speed === 0 ? 0 : particle.vx / speed;
	const ny = speed === 0 ? 0 : particle.vy / speed;

	ctx.save();
	ctx.strokeStyle = is_dark
		? `rgba(170, 200, 230, ${RAIN_STROKE_ALPHA})`
		: `rgba(90, 120, 170, ${RAIN_STROKE_ALPHA})`;
	ctx.lineWidth = 1.2;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(particle.x, particle.y);
	ctx.lineTo(particle.x + nx * length, particle.y + ny * length);
	ctx.stroke();
	ctx.restore();
}

function draw_firefly(ctx: CanvasRenderingContext2D, particle: Particle): void {
	// Pulsing glow using time-varying radius + radial gradient.
	const phase = particle.extra + particle.age * 0.003;
	const pulse = 0.6 + 0.4 * Math.sin(phase);
	const glow_radius = FIREFLY_GLOW_RADIUS * particle.scale * pulse;
	const life_ratio = 1 - particle.age / particle.lifetime;
	const alpha = Math.min(1, life_ratio * 2);

	const gradient = ctx.createRadialGradient(
		particle.x,
		particle.y,
		0,
		particle.x,
		particle.y,
		glow_radius,
	);
	gradient.addColorStop(0, `rgba(255, 240, 140, ${alpha * 0.95})`);
	gradient.addColorStop(0.4, `rgba(255, 210, 90, ${alpha * 0.5})`);
	gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');

	ctx.save();
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(particle.x, particle.y, glow_radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}
