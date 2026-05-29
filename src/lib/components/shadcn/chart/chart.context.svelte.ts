import { createContext } from 'svelte';
import type { Tooltip } from 'layerchart';
import type { Component, Snippet } from 'svelte';

export const THEMES = { light: '', dark: "[data-theme='dark']" } as const;

export type ChartConfig = {
	[k in string]: {
		label?: string;
		icon?: Component;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

// fallow-ignore-next-line unused-type
export type ExtractSnippetParams<T> = T extends Snippet<[infer P]> ? P : never;

export type TooltipPayload = Tooltip.TooltipSeries;

// fallow-ignore-next-line complexity
export function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: TooltipPayload,
	key: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: Record<string, any> | null,
) {
	if (typeof payload !== 'object' || payload === null) {
		return undefined;
	}

	const payloadConfig =
		'config' in payload && typeof payload.config === 'object' && payload.config !== null
			? payload.config
			: undefined;

	let configLabelKey: string = key;

	if (payload.key === key) {
		configLabelKey = payload.key;
	} else if (payload.label === key) {
		configLabelKey = payload.label;
	} else if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadConfig !== undefined &&
		key in payloadConfig &&
		typeof payloadConfig[key as keyof typeof payloadConfig] === 'string'
	) {
		configLabelKey = payloadConfig[key as keyof typeof payloadConfig] as string;
	} else if (data != null && key in data && typeof data[key] === 'string') {
		configLabelKey = data[key] as string;
	}

	return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ChartContextValue {
	config: ChartConfig;
}

type ChartContext = ReturnType<typeof createChartContext>;

const [useChart, setChartInternal] = createContext<ChartContext>();
export { useChart };

export function setChartContext(value: ChartContextValue) {
	const ctx = createChartContext(value);
	setChartInternal(ctx);
	return ctx;
}

function createChartContext(value: ChartContextValue) {
	return {
		get config() {
			return value.config;
		},
	};
}
