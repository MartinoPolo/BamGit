export const CHART_COLOR_THEMES = {
	monochrome: 'monochrome',
	trafficLight: 'traffic-light',
	gradient: 'gradient',
} as const;

export type ChartColorTheme = (typeof CHART_COLOR_THEMES)[keyof typeof CHART_COLOR_THEMES];

export function isChartColorTheme(value: unknown): value is ChartColorTheme {
	return (
		typeof value === 'string' &&
		Object.values(CHART_COLOR_THEMES).includes(value as ChartColorTheme)
	);
}

export const GROUP_BY_OPTIONS = {
	none: 'none',
	model: 'model',
	provider: 'provider',
	category: 'category',
} as const;

export type GroupByOption = (typeof GROUP_BY_OPTIONS)[keyof typeof GROUP_BY_OPTIONS];

export function isGroupByOption(value: unknown): value is GroupByOption {
	return (
		typeof value === 'string' &&
		Object.values(GROUP_BY_OPTIONS).includes(value as GroupByOption)
	);
}

export type MetricsPeriod = 'today' | 'week' | 'thirty-days' | 'month' | 'all' | 'custom';

export const PERIODS: { value: MetricsPeriod; label: string }[] = [
	{ value: 'today', label: 'Today' },
	{ value: 'week', label: '7d' },
	{ value: 'thirty-days', label: '30d' },
	{ value: 'month', label: 'Month' },
	{ value: 'all', label: 'All' },
];

export const REFRESH_STATES = {
	idle: 'idle',
	loading: 'loading',
	fresh: 'fresh',
	stale: 'stale',
	newDataAvailable: 'new-data-available',
} as const;

export type RefreshState = (typeof REFRESH_STATES)[keyof typeof REFRESH_STATES];

export const FRESH_THRESHOLD_MS = 30_000;
export const STALE_THRESHOLD_MS = 120_000;

const METRICS_PERIOD_VALUES = new Set<string>([
	'today',
	'week',
	'thirty-days',
	'month',
	'all',
	'custom',
]);

export function isMetricsPeriod(value: unknown): value is MetricsPeriod {
	return typeof value === 'string' && METRICS_PERIOD_VALUES.has(value);
}

export const USAGE_SCOPES = {
	workspace: 'workspace',
	global: 'global',
} as const;

export type UsageScope = (typeof USAGE_SCOPES)[keyof typeof USAGE_SCOPES];

export function isUsageScope(value: unknown): value is UsageScope {
	return typeof value === 'string' && Object.values(USAGE_SCOPES).includes(value as UsageScope);
}
