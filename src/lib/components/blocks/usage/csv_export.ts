import { invoke } from '$lib/tauri.js';
import type { UsageDashboardData } from '$lib/types/generated/index.js';
import { convertFromUsd } from '$lib/modules/usage/currency.js';

export interface CsvCurrencyOptions {
	currency: string;
	exchangeRate: number;
}

function convertCost(costUsd: number, options?: CsvCurrencyOptions): number {
	if (options === undefined) {
		return costUsd;
	}
	return convertFromUsd(costUsd, options.currency, { [options.currency]: options.exchangeRate });
}

function costHeader(options?: CsvCurrencyOptions): string {
	return `Cost (${options?.currency ?? 'USD'})`;
}

export function generateUsageCsv(
	data: UsageDashboardData,
	currencyOptions?: CsvCurrencyOptions,
): string {
	const sections: string[] = [];

	const summaryLines = [
		'=== Summary ===',
		`Total Cost,${convertCost(data.stats.total_cost_usd, currencyOptions).toFixed(2)}`,
		`Sessions,${data.stats.session_count}`,
		`One-Shot Rate,${data.stats.one_shot_rate.toFixed(2)}%`,
		`Cache Hit,${data.stats.cache_hit_ratio.toFixed(2)}%`,
	];
	sections.push(summaryLines.join('\n'));

	const dailyLines = [
		'=== Daily Costs ===',
		`Date,${costHeader(currencyOptions)},Sessions`,
		...data.time_bucket_costs.map(
			(entry) =>
				`${entry.date},${convertCost(entry.cost_usd, currencyOptions).toFixed(2)},${entry.session_count}`,
		),
	];
	sections.push(dailyLines.join('\n'));

	const activityLines = [
		'=== Activity Breakdown ===',
		`Category,${costHeader(currencyOptions)},Turns,One-Shot %`,
		...data.activity_breakdown.map(
			(entry) =>
				`${entry.category},${convertCost(entry.cost_usd, currencyOptions).toFixed(2)},${entry.turn_count},${entry.one_shot_percent.toFixed(2)}`,
		),
	];
	sections.push(activityLines.join('\n'));

	const sessionLines = [
		'=== Top Sessions ===',
		`Session ID,Issue,${costHeader(currencyOptions)},Turns,Tool Calls,Started`,
		...data.top_sessions.map(
			(entry) =>
				`${entry.session_id},${entry.issue_name ?? ''},${convertCost(entry.cost_usd, currencyOptions).toFixed(2)},${entry.turn_count},${entry.tool_call_count},${entry.started_at}`,
		),
	];
	sections.push(sessionLines.join('\n'));

	const toolLines = [
		'=== Tool Usage ===',
		'Tool,Calls',
		...data.tool_usage.map((entry) => `${entry.tool_name},${entry.call_count}`),
	];
	sections.push(toolLines.join('\n'));

	return sections.join('\n\n');
}

export async function exportUsageCsv(
	data: UsageDashboardData,
	period: string,
	currencyOptions?: CsvCurrencyOptions,
): Promise<void> {
	const csv = generateUsageCsv(data, currencyOptions);
	const currencySuffix = currencyOptions ? `-${currencyOptions.currency.toLowerCase()}` : '';
	const defaultName = `usage-${period}${currencySuffix}-${new Date().toISOString().slice(0, 10)}.csv`;

	try {
		await invoke('save_file', {
			content: csv,
			defaultName,
			filterName: 'CSV',
			filterExtensions: ['csv'],
		});
	} catch {
		downloadCsvFallback(csv, defaultName);
	}
}

function downloadCsvFallback(csv: string, filename: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
