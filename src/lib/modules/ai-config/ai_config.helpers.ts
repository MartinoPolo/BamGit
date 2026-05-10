import type { ConfigSource } from '$lib/types/generated';
import type { SortBy, GroupBy } from './ai_config.context.svelte.js';

// ─── Shared Types ────────────────────────────────────────────────────────────

export type ItemKind = 'skill' | 'agent' | 'hook' | 'mcp' | 'memory' | 'instruction' | 'rule';

// ─── Path helpers ────────────────────────────────────────────────────────────

export function getParentDir(filePath: string | null): string | null {
	if (filePath === null || filePath === '' || filePath.startsWith('mcp://')) {
		return null;
	}
	const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
	return idx > 0 ? filePath.slice(0, idx) : null;
}

export function makeMcpKey(s: { provider: string; source: string; name: string }): string {
	return `mcp://${s.provider}/${s.source}/${s.name}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SortableItem {
	name?: string;
	filename?: string;
	source?: ConfigSource;
	category?: string | null;
}

// ─── Sort ────────────────────────────────────────────────────────────────────

const SOURCE_ORDER: Record<string, number> = { user: 0, project: 1, custom: 2 };

function sourceRank(source: string | undefined): number {
	return source !== undefined && source in SOURCE_ORDER ? SOURCE_ORDER[source] : 99;
}

export function sortItems<T extends SortableItem>(items: T[], by: SortBy): T[] {
	return [...items].sort((a, b) => {
		if (by === 'source') {
			const rankDiff = sourceRank(a.source) - sourceRank(b.source);
			if (rankDiff !== 0) {
				return rankDiff;
			}
		}
		if (by === 'category') {
			const catA = a.category ?? '';
			const catB = b.category ?? '';
			if (catA !== catB) {
				return catA.localeCompare(catB);
			}
		}
		const nameA = a.name ?? a.filename ?? '';
		const nameB = b.name ?? b.filename ?? '';
		return nameA.localeCompare(nameB);
	});
}

// ─── Group ───────────────────────────────────────────────────────────────────

export function groupItems<T extends SortableItem>(items: T[], by: GroupBy): Map<string, T[]> {
	const result = new Map<string, T[]>();

	if (by === 'flat') {
		result.set('all', items);
		return result;
	}

	for (const item of items) {
		let key: string;
		if (by === 'source') {
			key = item.source ?? 'unknown';
		} else {
			key = item.category ?? 'uncategorized';
		}
		const existing = result.get(key);
		if (existing !== undefined) {
			existing.push(item);
		} else {
			result.set(key, [item]);
		}
	}

	return result;
}

// ─── Language detection ──────────────────────────────────────────────────────

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
	ts: 'TypeScript',
	tsx: 'TypeScript',
	js: 'JavaScript',
	jsx: 'JavaScript',
	mjs: 'JavaScript',
	cjs: 'JavaScript',
	py: 'Python',
	rs: 'Rust',
	go: 'Go',
	java: 'Java',
	kt: 'Kotlin',
	swift: 'Swift',
	cs: 'C#',
	cpp: 'C++',
	c: 'C',
	rb: 'Ruby',
	php: 'PHP',
	sh: 'Shell',
	bash: 'Shell',
	zsh: 'Shell',
	ps1: 'PowerShell',
	md: 'Markdown',
	json: 'JSON',
	yaml: 'YAML',
	yml: 'YAML',
	toml: 'TOML',
	svelte: 'Svelte',
	vue: 'Vue',
	html: 'HTML',
	css: 'CSS',
	scss: 'SCSS',
	sql: 'SQL',
};

export function deriveLanguage(filename: string): string | null {
	const dotIndex = filename.lastIndexOf('.');
	if (dotIndex === -1) {
		return null;
	}
	const ext = filename.slice(dotIndex + 1).toLowerCase();
	return EXTENSION_LANGUAGE_MAP[ext] ?? null;
}
