import { describe, it, expect } from 'vitest';
import {
	create_particle_pool,
	acquire,
	count_alive_of_kind,
	for_each_alive,
} from './particle_pool';
import {
	initialize_particle,
	update_particles,
	compute_spawn_count,
	type Viewport,
} from './particle_system';
import type { Particle, ParticleKind } from './particle_types';

const VIEWPORT: Viewport = { width: 1000, height: 600 };

function deterministic_rng(values: number[]): () => number {
	let i = 0;
	return () => {
		const value = values[i % values.length];
		i++;
		return value;
	};
}

function spawn_one(
	kind: ParticleKind,
	rng: () => number = deterministic_rng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
): Particle {
	const pool = create_particle_pool(1);
	const particle = acquire(pool);
	if (particle === null) {
		throw new Error('pool exhausted');
	}
	initialize_particle(particle, kind, VIEWPORT, rng);
	return particle;
}

describe('initialize_particle — leaves', () => {
	it('starts above the viewport top edge', () => {
		const particle = spawn_one('leaf');
		expect(particle.y).toBeLessThanOrEqual(0);
	});

	it('falls downward with non-zero vertical velocity', () => {
		const particle = spawn_one('leaf');
		expect(particle.vy).toBeGreaterThan(0);
	});

	it('sets lifetime from the leaf config', () => {
		const particle = spawn_one('leaf');
		expect(particle.lifetime).toBeGreaterThan(0);
	});

	it('has non-zero rotation speed for tumbling', () => {
		const particle = spawn_one('leaf', deterministic_rng([0.2, 0.9, 0.1, 0.3, 0.7, 0.8, 0.4]));
		expect(particle.rotationSpeed).not.toBe(0);
	});

	it('sets kind to leaf', () => {
		const particle = spawn_one('leaf');
		expect(particle.kind).toBe('leaf');
	});
});

describe('initialize_particle — rain', () => {
	it('starts above the viewport top edge', () => {
		const particle = spawn_one('rain');
		expect(particle.y).toBeLessThanOrEqual(0);
	});

	it('has high downward velocity (fast fall)', () => {
		const leaf = spawn_one('leaf');
		const rain = spawn_one('rain');
		expect(rain.vy).toBeGreaterThan(leaf.vy);
	});

	it('has non-zero horizontal velocity (diagonal)', () => {
		const particle = spawn_one('rain');
		expect(particle.vx).not.toBe(0);
	});
});

describe('initialize_particle — firefly', () => {
	it('starts somewhere inside the viewport', () => {
		const particle = spawn_one('firefly');
		expect(particle.x).toBeGreaterThanOrEqual(0);
		expect(particle.x).toBeLessThanOrEqual(VIEWPORT.width);
		expect(particle.y).toBeGreaterThanOrEqual(0);
		expect(particle.y).toBeLessThanOrEqual(VIEWPORT.height);
	});

	it('drifts gently (low velocity)', () => {
		const rain = spawn_one('rain');
		const firefly = spawn_one('firefly');
		expect(Math.abs(firefly.vy)).toBeLessThan(Math.abs(rain.vy));
	});
});

describe('initialize_particle — distribution uses rng', () => {
	it('spawns at left edge when rng returns 0', () => {
		const particle = spawn_one('leaf', deterministic_rng([0]));
		expect(particle.x).toBe(0);
	});

	it('spawns near the right edge when rng returns ~1', () => {
		const particle = spawn_one('leaf', deterministic_rng([0.999]));
		expect(particle.x).toBeGreaterThan(VIEWPORT.width * 0.99);
		expect(particle.x).toBeLessThanOrEqual(VIEWPORT.width);
	});
});

describe('update_particles — advances position', () => {
	it('moves particle by velocity * delta', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		const x_before = particle.x;
		const y_before = particle.y;
		update_particles(pool, 16, VIEWPORT);
		expect(particle.x).toBeCloseTo(x_before + particle.vx * 16, 4);
		expect(particle.y).toBeCloseTo(y_before + particle.vy * 16, 4);
	});

	it('advances age by delta', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		update_particles(pool, 100, VIEWPORT);
		expect(particle.age).toBe(100);
	});
});

describe('update_particles — releases expired particles', () => {
	it('releases particles whose age exceeds lifetime', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		particle.lifetime = 50;
		update_particles(pool, 100, VIEWPORT);
		expect(particle.alive).toBe(false);
	});

	it('keeps particles whose age is under lifetime', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		particle.lifetime = 10000;
		update_particles(pool, 50, VIEWPORT);
		expect(particle.alive).toBe(true);
	});
});

describe('update_particles — releases off-screen particles', () => {
	it('releases particles that fall below the viewport', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		particle.y = VIEWPORT.height + 1000;
		update_particles(pool, 1, VIEWPORT);
		expect(particle.alive).toBe(false);
	});

	it('keeps particles inside the viewport', () => {
		const pool = create_particle_pool(1);
		const particle = acquire(pool) as Particle;
		initialize_particle(particle, 'leaf', VIEWPORT, () => 0.5);
		particle.x = 100;
		particle.y = 100;
		update_particles(pool, 1, VIEWPORT);
		expect(particle.alive).toBe(true);
	});
});

describe('compute_spawn_count — spawn rate accumulator', () => {
	it('returns 0 for short deltas that do not reach 1 particle', () => {
		// 4 particles/sec means 250ms/particle. 100ms delta → 0.4 particles
		const result = compute_spawn_count(4, 100, 0);
		expect(result.count).toBe(0);
	});

	it('returns 1 particle once the accumulator crosses 1', () => {
		// 4 particles/sec * 250ms = 1.0 particle exactly
		const result = compute_spawn_count(4, 250, 0);
		expect(result.count).toBe(1);
	});

	it('accumulates fractional remainder to next tick', () => {
		// 4/sec * 300ms = 1.2; count=1, remainder=0.2
		const result = compute_spawn_count(4, 300, 0);
		expect(result.count).toBe(1);
		expect(result.remainder).toBeCloseTo(0.2, 4);
	});

	it('preserves prior remainder', () => {
		// prior 0.9 + (4/sec * 100ms = 0.4) = 1.3 → count=1, remainder=0.3
		const result = compute_spawn_count(4, 100, 0.9);
		expect(result.count).toBe(1);
		expect(result.remainder).toBeCloseTo(0.3, 4);
	});

	it('returns 0 when rate is 0', () => {
		const result = compute_spawn_count(0, 1000, 0);
		expect(result.count).toBe(0);
		expect(result.remainder).toBe(0);
	});
});

describe('particle system — performance budget', () => {
	it('updates a fully-populated 200-slot pool in under 1ms per tick', () => {
		const pool = create_particle_pool(200);
		for (let i = 0; i < 200; i++) {
			const particle = acquire(pool);
			if (particle !== null) {
				initialize_particle(
					particle,
					i % 3 === 0 ? 'leaf' : i % 3 === 1 ? 'rain' : 'firefly',
					VIEWPORT,
					() => (i * 0.137) % 1,
				);
			}
		}
		// Warm up.
		update_particles(pool, 16, VIEWPORT);
		const ITERATIONS = 60;
		const start = performance.now();
		for (let n = 0; n < ITERATIONS; n++) {
			update_particles(pool, 16, VIEWPORT);
		}
		const elapsed_per_tick = (performance.now() - start) / ITERATIONS;
		expect(elapsed_per_tick).toBeLessThan(1);
	});

	it('pool still contains alive slots after steady-state update', () => {
		const pool = create_particle_pool(60);
		for (let i = 0; i < 60; i++) {
			const particle = acquire(pool);
			if (particle !== null) {
				initialize_particle(particle, 'leaf', VIEWPORT, () => (i * 0.137) % 1);
			}
		}
		update_particles(pool, 16, VIEWPORT);
		let alive_count = 0;
		for_each_alive(pool, () => alive_count++);
		expect(alive_count).toBeGreaterThan(0);
		expect(count_alive_of_kind(pool, 'leaf')).toBe(alive_count);
	});
});
