import { describe, it, expect } from 'vitest';
import { generateUsageCsv } from './csv_export.js';
import type { UsageDashboardData } from '$lib/types/generated/index.js';

function createTestData(overrides: Partial<UsageDashboardData> = {}): UsageDashboardData {
	return {
		stats: {
			total_cost_usd: 42.5,
			session_count: 15,
			one_shot_rate: 73,
			cache_hit_ratio: 85,
			cost_delta_percent: 12.5,
			session_count_delta: 3,
		},
		time_bucket_costs: [
			{ date: '2026-05-01', cost_usd: 10.123, session_count: 5 },
			{ date: '2026-05-02', cost_usd: 8.0, session_count: 3 },
		],
		grouped_costs: [],
		activity_breakdown: [
			{ category: 'coding', cost_usd: 25.0, turn_count: 100, one_shot_percent: 80.5 },
			{ category: 'debugging', cost_usd: 17.5, turn_count: 50, one_shot_percent: 60.0 },
		],
		top_sessions: [
			{
				session_id: 'sess-001',
				issue_name: 'Fix login bug',
				issue_number: 42,
				cost_usd: 12.34,
				turn_count: 25,
				tool_call_count: 40,
				started_at: '2026-05-01T10:00:00Z',
				pricing_available: true,
			},
		],
		tool_usage: [
			{ tool_name: 'Read', call_count: 150 },
			{ tool_name: 'Edit', call_count: 75 },
		],
		pricing_available: true,
		...overrides,
	};
}

describe('generateUsageCsv', () => {
	it('produces all 5 section headers', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('=== Summary ===');
		expect(csv).toContain('=== Daily Costs ===');
		expect(csv).toContain('=== Activity Breakdown ===');
		expect(csv).toContain('=== Top Sessions ===');
		expect(csv).toContain('=== Tool Usage ===');
	});

	it('sections are separated by blank lines', () => {
		const csv = generateUsageCsv(createTestData());
		const sections = csv.split('\n\n');
		expect(sections.length).toBeGreaterThanOrEqual(5);
	});
});

describe('generateUsageCsv — Summary section', () => {
	it('contains Total Cost', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Total Cost');
		expect(csv).toContain('42.50');
	});

	it('contains Sessions', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Sessions');
		expect(csv).toContain('15');
	});

	it('contains One-Shot Rate', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('One-Shot Rate');
		expect(csv).toContain('73.00%');
	});

	it('contains Cache Hit', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Cache Hit');
		expect(csv).toContain('85.00%');
	});
});

describe('generateUsageCsv — Daily Costs section', () => {
	it('has correct header', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Date,Cost (USD),Sessions');
	});

	it('has one row per time_bucket_cost entry', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('2026-05-01,10.12,5');
		expect(csv).toContain('2026-05-02,8.00,3');
	});

	it('formats cost to 2 decimals', () => {
		const data = createTestData({
			time_bucket_costs: [{ date: '2026-05-03', cost_usd: 1.999, session_count: 1 }],
		});
		const csv = generateUsageCsv(data);
		expect(csv).toContain('2026-05-03,2.00,1');
	});
});

describe('generateUsageCsv — Activity Breakdown section', () => {
	it('has correct header', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Category,Cost (USD),Turns,One-Shot %');
	});

	it('has one row per activity_breakdown entry', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('coding,25.00,100,80.50');
		expect(csv).toContain('debugging,17.50,50,60.00');
	});
});

describe('generateUsageCsv — Top Sessions section', () => {
	it('has correct header', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Session ID,Issue,Cost (USD),Turns,Tool Calls,Started');
	});

	it('has one row per top_session entry', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('sess-001,Fix login bug,12.34,25,40,2026-05-01T10:00:00Z');
	});

	it('handles null issue_name', () => {
		const data = createTestData({
			top_sessions: [
				{
					session_id: 'sess-002',
					issue_name: null,
					issue_number: null,
					cost_usd: 5.0,
					turn_count: 10,
					tool_call_count: 20,
					started_at: '2026-05-02T14:00:00Z',
					pricing_available: true,
				},
			],
		});
		const csv = generateUsageCsv(data);
		expect(csv).toContain('sess-002,,5.00,10,20,2026-05-02T14:00:00Z');
	});
});

describe('generateUsageCsv — Tool Usage section', () => {
	it('has correct header', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Tool,Calls');
	});

	it('has one row per tool_usage entry', () => {
		const csv = generateUsageCsv(createTestData());
		expect(csv).toContain('Read,150');
		expect(csv).toContain('Edit,75');
	});
});
