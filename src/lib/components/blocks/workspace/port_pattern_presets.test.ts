import { describe, expect, it } from 'vitest';
import { PORT_PATTERN_PRESETS } from './port_pattern_presets.js';

function extractPort(line: string, pattern: string): number | null {
	const regex = new RegExp(pattern);
	const match = regex.exec(line);
	if (match === null || match[1] === undefined) {
		return null;
	}
	return parseInt(match[1], 10);
}

describe('PORT_PATTERN_PRESETS', () => {
	it('has at least 4 regex presets plus Custom', () => {
		expect(PORT_PATTERN_PRESETS.length).toBeGreaterThanOrEqual(5);
	});

	it('each preset has id, label, and regex (null for custom)', () => {
		for (const preset of PORT_PATTERN_PRESETS) {
			expect(preset.id).toBeTruthy();
			expect(preset.label).toBeTruthy();
			if (preset.id === 'custom') {
				expect(preset.regex).toBeNull();
			} else {
				expect(preset.regex).toBeTruthy();
			}
		}
	});

	it('has exactly one recommended preset', () => {
		const recommended = PORT_PATTERN_PRESETS.filter((p) => p.recommended === true);
		expect(recommended).toHaveLength(1);
	});
});

describe('Generic localhost preset', () => {
	const preset = PORT_PATTERN_PRESETS.find((p) => p.id === 'generic-localhost');

	it('exists with correct label', () => {
		expect(preset).toBeDefined();
		expect(preset!.label).toBe('Generic localhost');
	});

	it('matches localhost:PORT', () => {
		expect(extractPort('localhost:3000', preset!.regex!)).toBe(3000);
	});

	it('matches 127.0.0.1:PORT', () => {
		expect(extractPort('127.0.0.1:4000', preset!.regex!)).toBe(4000);
	});

	it('matches inside longer text', () => {
		expect(extractPort('Server running at http://localhost:8080/api', preset!.regex!)).toBe(
			8080,
		);
	});

	it('does not match unrelated text', () => {
		expect(extractPort('Compiling source files...', preset!.regex!)).toBeNull();
	});
});

describe('Vite / Storybook preset', () => {
	const preset = PORT_PATTERN_PRESETS.find((p) => p.id === 'vite-storybook');

	it('exists with correct label', () => {
		expect(preset).toBeDefined();
		expect(preset!.label).toBe('Vite / Storybook');
	});

	it('matches Vite dev server output', () => {
		const line = '  ➜  Local:   http://localhost:5173/';
		expect(extractPort(line, preset!.regex!)).toBe(5173);
	});

	it('matches Storybook output', () => {
		const line = '  ╎ Local:   http://localhost:6006/';
		expect(extractPort(line, preset!.regex!)).toBe(6006);
	});

	it('matches Vite with different port', () => {
		const line = '  ➜  Local:   http://localhost:1420/';
		expect(extractPort(line, preset!.regex!)).toBe(1420);
	});

	it('does not match generic localhost references', () => {
		expect(extractPort('http://localhost:3000', preset!.regex!)).toBeNull();
	});
});

describe('Next.js preset', () => {
	const preset = PORT_PATTERN_PRESETS.find((p) => p.id === 'nextjs');

	it('exists with correct label', () => {
		expect(preset).toBeDefined();
		expect(preset!.label).toBe('Next.js');
	});

	it('matches Next.js ready output', () => {
		const line = 'ready - started server on 0.0.0.0:3000, url: http://localhost:3000';
		expect(extractPort(line, preset!.regex!)).toBe(3000);
	});

	it('matches newer Next.js format', () => {
		const line = '  ▲ Next.js 14.0.0\n  - Local: http://localhost:3000';
		expect(extractPort(line, preset!.regex!)).toBe(3000);
	});

	it('does not match 127.0.0.1 addresses', () => {
		expect(extractPort('Server running at 127.0.0.1:3000', preset!.regex!)).toBeNull();
	});

	it('does not match non-localhost', () => {
		expect(extractPort('Compiling...', preset!.regex!)).toBeNull();
	});
});

describe('Express preset', () => {
	const preset = PORT_PATTERN_PRESETS.find((p) => p.id === 'express');

	it('exists with correct label', () => {
		expect(preset).toBeDefined();
		expect(preset!.label).toBe('Express');
	});

	it('matches "port 8080" pattern', () => {
		const line = 'Server listening on port 8080';
		expect(extractPort(line, preset!.regex!)).toBe(8080);
	});

	it('matches "port 3000" with extra whitespace', () => {
		const line = 'Express app started on port  3000';
		expect(extractPort(line, preset!.regex!)).toBe(3000);
	});

	it('does not match text without port keyword', () => {
		expect(extractPort('http://localhost:3000', preset!.regex!)).toBeNull();
	});
});

describe('Custom preset', () => {
	const preset = PORT_PATTERN_PRESETS.find((p) => p.id === 'custom');

	it('exists with correct label', () => {
		expect(preset).toBeDefined();
		expect(preset!.label).toBe('Custom regex');
	});

	it('has null regex', () => {
		expect(preset!.regex).toBeNull();
	});
});
