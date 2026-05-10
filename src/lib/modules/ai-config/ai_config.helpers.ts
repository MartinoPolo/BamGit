import type {
	ConfigSource,
	SkillConfig,
	AgentConfig,
	HookConfig,
	McpServerConfig,
	MemoryConfig,
	InstructionConfig,
	RuleConfig,
} from '$lib/types/generated';
import type { SortBy, GroupBy } from './ai_config.context.svelte.js';

// ─── Shared Types ────────────────────────────────────────────────────────────

export type ItemKind = 'skill' | 'agent' | 'hook' | 'mcp' | 'memory' | 'instruction' | 'rule';

export type AnyItem =
	| SkillConfig
	| AgentConfig
	| HookConfig
	| McpServerConfig
	| MemoryConfig
	| InstructionConfig
	| RuleConfig;

// ─── Item field helpers ──────────────────────────────────────────────────────

export function getItemTitle(item: AnyItem, kind: ItemKind): string {
	if (kind === 'hook' || kind === 'instruction' || kind === 'rule') {
		return (item as HookConfig | InstructionConfig | RuleConfig).filename;
	}
	return (item as SkillConfig | AgentConfig | McpServerConfig | MemoryConfig).name;
}

// fallow-ignore-next-line complexity
export function getItemDescription(item: AnyItem, kind: ItemKind): string | null {
	if (kind === 'hook') {
		return (item as HookConfig).description ?? null;
	}
	if (kind === 'mcp' || kind === 'instruction') {
		return null;
	}
	if (kind === 'rule') {
		return (item as RuleConfig).description ?? null;
	}
	return (item as SkillConfig | AgentConfig | MemoryConfig).description ?? null;
}

export function getItemFilePath(item: AnyItem, kind: ItemKind): string | null {
	if (kind === 'mcp') {
		return null;
	}
	return (item as Exclude<AnyItem, McpServerConfig>).file_path ?? null;
}

export function getItemLineCount(item: AnyItem): number | null {
	if (!('content' in item) || typeof item.content !== 'string') {
		return null;
	}
	return item.content.split('\n').length;
}

export function getItemFileSizeLabel(item: AnyItem, kind: ItemKind): string | null {
	if (kind !== 'instruction') {
		return null;
	}
	const size = (item as InstructionConfig).file_size;
	if (size < 1024) {
		return `${size} B`;
	}
	return `${(size / 1024).toFixed(1)} KB`;
}

// ─── Discovery lookup helpers ────────────────────────────────────────────────

interface ItemLookupSource {
	skills: SkillConfig[];
	agents: AgentConfig[];
	hooks: HookConfig[];
	memories: MemoryConfig[];
	instructions: InstructionConfig[];
	rules: RuleConfig[];
}

export function findItemByPath(
	result: ItemLookupSource | null,
	path: string | null,
): AnyItem | null {
	if (path === null || result === null) {
		return null;
	}
	return (
		result.skills.find((s) => s.file_path === path) ??
		result.agents.find((a) => a.file_path === path) ??
		result.memories.find((m) => m.file_path === path) ??
		result.instructions.find((i) => i.file_path === path) ??
		result.rules.find((r) => r.file_path === path) ??
		result.hooks.find((h) => h.file_path === path) ??
		null
	);
}

// fallow-ignore-next-line complexity
export function findKindByPath(
	result: ItemLookupSource | null,
	path: string | null,
): ItemKind | null {
	if (path === null || result === null) {
		return null;
	}
	if (result.skills.some((s) => s.file_path === path)) {
		return 'skill';
	}
	if (result.agents.some((a) => a.file_path === path)) {
		return 'agent';
	}
	if (result.memories.some((m) => m.file_path === path)) {
		return 'memory';
	}
	if (result.instructions.some((i) => i.file_path === path)) {
		return 'instruction';
	}
	if (result.rules.some((r) => r.file_path === path)) {
		return 'rule';
	}
	if (result.hooks.some((h) => h.file_path === path)) {
		return 'hook';
	}
	return null;
}

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

// fallow-ignore-next-line complexity
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
