export const PORT_PATTERN_PRESETS = [
	{
		id: 'generic-localhost',
		label: 'Generic localhost',
		regex: String.raw`(?:localhost|127\.0\.0\.1):(\d+)`,
		recommended: true,
	},
	{
		id: 'vite-storybook',
		label: 'Vite / Storybook',
		regex: String.raw`Local:\s+http://localhost:(\d+)`,
		recommended: false,
	},
	{
		id: 'nextjs',
		label: 'Next.js',
		regex: String.raw`localhost:(\d+)`,
		recommended: false,
	},
	{
		id: 'express',
		label: 'Express',
		regex: String.raw`port\s+(\d+)`,
		recommended: false,
	},
	{
		id: 'custom',
		label: 'Custom regex',
		regex: null,
		recommended: false,
	},
] as const;

export type PortPatternPreset = (typeof PORT_PATTERN_PRESETS)[number];
