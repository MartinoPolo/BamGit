import { invoke } from '$lib/tauri.js';
import type { UsageDashboardData } from '$lib/types/generated/index.js';

export function generateUsageCsv(data: UsageDashboardData): string {
	const sections: string[] = [];

	// Summary
	const summaryLines = [
		'=== Summary ===',
		`Total Cost,$${data.stats.total_cost_usd.toFixed(2)}`,
		`Sessions,${data.stats.session_count}`,
		`One-Shot Rate,${data.stats.one_shot_rate.toFixed(2)}%`,
		`Cache Hit,${data.stats.cache_hit_ratio.toFixed(2)}%`,
	];
	sections.push(summaryLines.join('\n'));

	// Daily Costs
	const dailyLines = [
		'=== Daily Costs ===',
		'Date,Cost (USD),Sessions',
		...data.time_bucket_costs.map(
			(entry) => `${entry.date},${entry.cost_usd.toFixed(2)},${entry.session_count}`,
		),
	];
	sections.push(dailyLines.join('\n'));

	// Activity Breakdown
	const activityLines = [
		'=== Activity Breakdown ===',
		'Category,Cost (USD),Turns,One-Shot %',
		...data.activity_breakdown.map(
			(entry) =>
				`${entry.category},${entry.cost_usd.toFixed(2)},${entry.turn_count},${entry.one_shot_percent.toFixed(2)}`,
		),
	];
	sections.push(activityLines.join('\n'));

	// Top Sessions
	const sessionLines = [
		'=== Top Sessions ===',
		'Session ID,Issue,Cost (USD),Turns,Tool Calls,Started',
		...data.top_sessions.map(
			(entry) =>
				`${entry.session_id},${entry.issue_name ?? ''},${entry.cost_usd.toFixed(2)},${entry.turn_count},${entry.tool_call_count},${entry.started_at}`,
		),
	];
	sections.push(sessionLines.join('\n'));

	// Tool Usage
	const toolLines = [
		'=== Tool Usage ===',
		'Tool,Calls',
		...data.tool_usage.map((entry) => `${entry.tool_name},${entry.call_count}`),
	];
	sections.push(toolLines.join('\n'));

	return sections.join('\n\n');
}

export async function exportUsageCsv(data: UsageDashboardData, period: string): Promise<void> {
	const csv = generateUsageCsv(data);
	const defaultName = `usage-${period}-${new Date().toISOString().slice(0, 10)}.csv`;

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
