// ─── Particle System ──────────────────────────────────────────────────────
// Pure update/spawn logic. Takes a pool, mutates slots in place. Keeps the
// rAF loop allocation-free by reusing pool slots.

import {
	LEAF_CONFIG,
	RAIN_CONFIG,
	FIREFLY_CONFIG,
	VIEWPORT_MARGIN_PX,
	type Particle,
	type ParticleKind,
} from './particle_types';
import { release } from './particle_pool';
import type { ParticlePool } from './particle_pool';

export interface Viewport {
	readonly width: number;
	readonly height: number;
}

export interface SpawnCountResult {
	readonly count: number;
	readonly remainder: number;
}

// ─── Per-kind movement tuning (pixels per millisecond) ────────────────────

const LEAF_FALL_VY_MIN = 0.02;
const LEAF_FALL_VY_MAX = 0.05;
const LEAF_DRIFT_VX = 0.015;
const LEAF_SCALE_MIN = 0.6;
const LEAF_SCALE_MAX = 1.2;
const LEAF_ROTATION_SPEED = 0.003;

const RAIN_FALL_VY = 0.6;
const RAIN_DRIFT_VX = 0.2;
const RAIN_LENGTH_MIN = 10;
const RAIN_LENGTH_MAX = 18;

const FIREFLY_DRIFT_MAX = 0.02;
const FIREFLY_SCALE_MIN = 0.8;
const FIREFLY_SCALE_MAX = 1.4;

// ─── Initialization ───────────────────────────────────────────────────────

export function initialize_particle(
	particle: Particle,
	kind: ParticleKind,
	viewport: Viewport,
	rng: () => number,
): void {
	particle.kind = kind;
	particle.age = 0;
	particle.rotation = 0;
	particle.rotationSpeed = 0;
	particle.extra = 0;
	particle.scale = 1;
	switch (kind) {
		case 'leaf':
			initialize_leaf(particle, viewport, rng);
			return;
		case 'rain':
			initialize_rain(particle, viewport, rng);
			return;
		case 'firefly':
			initialize_firefly(particle, viewport, rng);
	}
}

function initialize_leaf(particle: Particle, viewport: Viewport, rng: () => number): void {
	particle.x = rng() * viewport.width;
	particle.y = -VIEWPORT_MARGIN_PX * rng();
	particle.vx = (rng() - 0.5) * 2 * LEAF_DRIFT_VX;
	particle.vy = LEAF_FALL_VY_MIN + rng() * (LEAF_FALL_VY_MAX - LEAF_FALL_VY_MIN);
	particle.lifetime = LEAF_CONFIG.maxLifetimeMs;
	particle.rotation = rng() * Math.PI * 2;
	particle.rotationSpeed = (rng() - 0.5) * 2 * LEAF_ROTATION_SPEED;
	particle.scale = LEAF_SCALE_MIN + rng() * (LEAF_SCALE_MAX - LEAF_SCALE_MIN);
	particle.extra = rng(); // hue offset 0..1
}

function initialize_rain(particle: Particle, viewport: Viewport, rng: () => number): void {
	particle.x = rng() * (viewport.width + VIEWPORT_MARGIN_PX * 2) - VIEWPORT_MARGIN_PX;
	particle.y = -VIEWPORT_MARGIN_PX;
	particle.vx = RAIN_DRIFT_VX;
	particle.vy = RAIN_FALL_VY;
	particle.lifetime = RAIN_CONFIG.maxLifetimeMs;
	particle.extra = RAIN_LENGTH_MIN + rng() * (RAIN_LENGTH_MAX - RAIN_LENGTH_MIN);
}

function initialize_firefly(particle: Particle, viewport: Viewport, rng: () => number): void {
	particle.x = rng() * viewport.width;
	particle.y = rng() * viewport.height;
	particle.vx = (rng() - 0.5) * 2 * FIREFLY_DRIFT_MAX;
	particle.vy = (rng() - 0.5) * 2 * FIREFLY_DRIFT_MAX;
	particle.lifetime = FIREFLY_CONFIG.maxLifetimeMs;
	particle.scale = FIREFLY_SCALE_MIN + rng() * (FIREFLY_SCALE_MAX - FIREFLY_SCALE_MIN);
	particle.extra = rng() * Math.PI * 2; // phase offset for pulsing
}

// ─── Update ───────────────────────────────────────────────────────────────

export function update_particles(pool: ParticlePool, delta_ms: number, viewport: Viewport): void {
	for (const slot of pool.slots) {
		if (!slot.alive) {
			continue;
		}
		slot.age += delta_ms;
		slot.x += slot.vx * delta_ms;
		slot.y += slot.vy * delta_ms;
		slot.rotation += slot.rotationSpeed * delta_ms;
		if (slot.age >= slot.lifetime || is_offscreen(slot, viewport)) {
			release(slot);
		}
	}
}

function is_offscreen(particle: Particle, viewport: Viewport): boolean {
	const margin = VIEWPORT_MARGIN_PX * 2;
	return (
		particle.y > viewport.height + margin ||
		particle.y < -margin ||
		particle.x < -margin ||
		particle.x > viewport.width + margin
	);
}

// ─── Spawn rate accumulator ───────────────────────────────────────────────

export function compute_spawn_count(
	rate_per_second: number,
	delta_ms: number,
	prior_remainder: number,
): SpawnCountResult {
	if (rate_per_second <= 0) {
		return { count: 0, remainder: 0 };
	}
	const accumulated = prior_remainder + (rate_per_second * delta_ms) / 1000;
	const count = Math.floor(accumulated);
	return { count, remainder: accumulated - count };
}
