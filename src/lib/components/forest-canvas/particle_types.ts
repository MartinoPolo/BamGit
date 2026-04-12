// ─── Particle Types & Configs ─────────────────────────────────────────────
// V1 particle system: hardcoded configs per kind, tuned by editing code.
// Mutable fields for object-pool reuse (no reallocation).

export type ParticleKind = 'leaf' | 'rain' | 'firefly';

export interface Particle {
	kind: ParticleKind;
	alive: boolean;
	x: number;
	y: number;
	/** Velocity in pixels per millisecond. */
	vx: number;
	vy: number;
	/** Age in milliseconds. */
	age: number;
	/** Total lifetime in milliseconds; particle is released when age exceeds this. */
	lifetime: number;
	/** Rotation in radians (leaves). */
	rotation: number;
	/** Angular velocity in radians per millisecond (leaves). */
	rotationSpeed: number;
	/** Scale factor used by renderer. */
	scale: number;
	/** Kind-specific numeric extra (leaf hue, firefly phase offset, rain length). */
	extra: number;
}

export interface ParticleConfig {
	/** Particles spawned per second at peak weather. */
	readonly spawnRatePerSecond: number;
	/** Milliseconds a particle persists before auto-release. */
	readonly maxLifetimeMs: number;
}

// Leaves drift down with horizontal sway, always active.
export const LEAF_CONFIG: ParticleConfig = {
	spawnRatePerSecond: 4,
	maxLifetimeMs: 12000,
} as const;

// Rain falls fast diagonally, only when merge-conflict overlay present.
export const RAIN_CONFIG: ParticleConfig = {
	spawnRatePerSecond: 90,
	maxLifetimeMs: 2500,
} as const;

// Fireflies drift slowly, only in dark mode.
export const FIREFLY_CONFIG: ParticleConfig = {
	spawnRatePerSecond: 2,
	maxLifetimeMs: 8000,
} as const;

/** Fixed pool size. ~200 slots covers steady-state needs for 20 trees at peak weather. */
export const POOL_SIZE = 200 as const;

/** Margin beyond viewport bounds before particles are released. */
export const VIEWPORT_MARGIN_PX = 40 as const;
