import { describe, it, expect } from 'vitest';
import { derive_weather } from './weather_state';
import type { TreeVisualization, TreeOverlay } from '$lib/types/tree_visualization';

function create_tree(overlays: readonly TreeOverlay[] = []): TreeVisualization {
	return {
		kind: 'tree',
		stage: 'leafy',
		overlays,
		companionSaplings: [],
		activeTools: [],
		fruitTypes: [],
	};
}

function create_potted_plant(overlays: readonly TreeOverlay[] = []): TreeVisualization {
	return {
		kind: 'potted-plant',
		stage: 'small-plant',
		overlays,
	};
}

describe('derive_weather — leaves', () => {
	it('leaves is true even with no visible trees', () => {
		const weather = derive_weather([], false);
		expect(weather.leaves).toBe(true);
	});

	it('leaves is always true (V1 decision)', () => {
		const weather = derive_weather([create_tree()], true);
		expect(weather.leaves).toBe(true);
	});
});

describe('derive_weather — rain from merge-conflict overlay', () => {
	it('rain is false when no trees have merge-conflict overlay', () => {
		const weather = derive_weather([create_tree(['behind-base']), create_tree()], false);
		expect(weather.rain).toBe(false);
	});

	it('rain is true when any tree has merge-conflict overlay', () => {
		const weather = derive_weather([create_tree(), create_tree(['merge-conflict'])], false);
		expect(weather.rain).toBe(true);
	});

	it('rain is true when potted plant has merge-conflict overlay', () => {
		const weather = derive_weather([create_potted_plant(['merge-conflict'])], false);
		expect(weather.rain).toBe(true);
	});

	it('rain is false when visualizations list is empty', () => {
		const weather = derive_weather([], false);
		expect(weather.rain).toBe(false);
	});
});

describe('derive_weather — fireflies in dark mode only', () => {
	it('fireflies is true in dark mode', () => {
		const weather = derive_weather([create_tree()], true);
		expect(weather.fireflies).toBe(true);
	});

	it('fireflies is false in light mode', () => {
		const weather = derive_weather([create_tree()], false);
		expect(weather.fireflies).toBe(false);
	});

	it('fireflies is true in dark mode even with no trees', () => {
		const weather = derive_weather([], true);
		expect(weather.fireflies).toBe(true);
	});
});
