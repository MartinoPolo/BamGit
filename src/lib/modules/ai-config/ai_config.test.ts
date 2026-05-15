import { describe, it, expect } from 'vitest';
import {
	getItemTitle,
	getItemDescription,
	getItemFilePath,
	getItemLineCount,
	getItemFileSizeLabel,
	getParentDir,
	makeMcpKey,
	deriveLanguage,
	sortItems,
	groupItems,
	findItemByPath,
	findKindByPath,
	type AnyItem,
} from './ai_config.helpers.js';

function makeSkill(overrides: Record<string, unknown> = {}): AnyItem {
	return {
		name: 'mp-commit',
		description: 'Stage and commit changes',
		file_path: '/home/user/.claude/skills/mp-commit.md',
		content: 'line1\nline2\nline3',
		source: 'user',
		category: 'workflow',
		...overrides,
	} as unknown as AnyItem;
}

function makeHook(overrides: Record<string, unknown> = {}): AnyItem {
	return {
		filename: 'pre-commit.sh',
		description: 'Runs before commit',
		file_path: '/project/.claude/hooks/pre-commit.sh',
		content: '#!/bin/bash\necho ok',
		source: 'project',
		event_type: 'PreToolUse',
		...overrides,
	} as unknown as AnyItem;
}

function makeInstruction(overrides: Record<string, unknown> = {}): AnyItem {
	return {
		filename: 'AGENTS.md',
		file_path: '/project/AGENTS.md',
		content: '# Agents\n\nBe concise.',
		file_size: 2048,
		source: 'project',
		...overrides,
	} as unknown as AnyItem;
}

function makeMcpServer(overrides: Record<string, unknown> = {}): AnyItem {
	return {
		name: 'context7',
		provider: 'claude-code',
		source: 'user',
		transport: 'stdio',
		...overrides,
	} as unknown as AnyItem;
}

function makeRule(overrides: Record<string, unknown> = {}): AnyItem {
	return {
		filename: 'svelte.md',
		description: 'Svelte rules',
		file_path: '/project/.claude/rules/svelte.md',
		content: '# Svelte\n\nUse runes.',
		source: 'project',
		category: 'framework',
		...overrides,
	} as unknown as AnyItem;
}

// ─── getItemTitle ─────────────────────────────────────────────────────────

describe('getItemTitle', () => {
	it('returns name for skill', () => {
		expect(getItemTitle(makeSkill(), 'skill')).toBe('mp-commit');
	});

	it('returns name for agent', () => {
		expect(getItemTitle(makeSkill({ name: 'my-agent' }), 'agent')).toBe('my-agent');
	});

	it('returns filename for hook', () => {
		expect(getItemTitle(makeHook(), 'hook')).toBe('pre-commit.sh');
	});

	it('returns filename for instruction', () => {
		expect(getItemTitle(makeInstruction(), 'instruction')).toBe('AGENTS.md');
	});

	it('returns filename for rule', () => {
		expect(getItemTitle(makeRule(), 'rule')).toBe('svelte.md');
	});

	it('returns name for mcp server', () => {
		expect(getItemTitle(makeMcpServer(), 'mcp')).toBe('context7');
	});

	it('returns name for memory', () => {
		expect(getItemTitle(makeSkill({ name: 'user-prefs' }), 'memory')).toBe('user-prefs');
	});
});

// ─── getItemDescription ────────────────────────────────────────────────────

describe('getItemDescription', () => {
	it('returns description for skill', () => {
		expect(getItemDescription(makeSkill(), 'skill')).toBe('Stage and commit changes');
	});

	it('returns null for mcp server', () => {
		expect(getItemDescription(makeMcpServer(), 'mcp')).toBeNull();
	});

	it('returns null for instruction', () => {
		expect(getItemDescription(makeInstruction(), 'instruction')).toBeNull();
	});

	it('returns description for hook', () => {
		expect(getItemDescription(makeHook(), 'hook')).toBe('Runs before commit');
	});

	it('returns null when description is missing', () => {
		expect(getItemDescription(makeSkill({ description: undefined }), 'skill')).toBeNull();
	});

	it('returns description for rule', () => {
		expect(getItemDescription(makeRule(), 'rule')).toBe('Svelte rules');
	});
});

// ─── getItemFilePath ────────────────────────────────────────────────────────

describe('getItemFilePath', () => {
	it('returns file_path for skill', () => {
		expect(getItemFilePath(makeSkill(), 'skill')).toBe(
			'/home/user/.claude/skills/mp-commit.md',
		);
	});

	it('returns null for mcp server', () => {
		expect(getItemFilePath(makeMcpServer(), 'mcp')).toBeNull();
	});

	it('returns file_path for instruction', () => {
		expect(getItemFilePath(makeInstruction(), 'instruction')).toBe('/project/AGENTS.md');
	});
});

// ─── getItemLineCount ───────────────────────────────────────────────────────

describe('getItemLineCount', () => {
	it('counts newlines in content', () => {
		expect(getItemLineCount(makeSkill({ content: 'a\nb\nc' }))).toBe(3);
	});

	it('single line content returns 1', () => {
		expect(getItemLineCount(makeSkill({ content: 'single line' }))).toBe(1);
	});

	it('returns null when no content property', () => {
		expect(getItemLineCount(makeMcpServer())).toBeNull();
	});
});

// ─── getItemFileSizeLabel ───────────────────────────────────────────────────

describe('getItemFileSizeLabel', () => {
	it('returns bytes for small instruction files', () => {
		expect(getItemFileSizeLabel(makeInstruction({ file_size: 512 }), 'instruction')).toBe(
			'512 B',
		);
	});

	it('returns KB for large instruction files', () => {
		expect(getItemFileSizeLabel(makeInstruction({ file_size: 2048 }), 'instruction')).toBe(
			'2.0 KB',
		);
	});

	it('returns null for non-instruction items', () => {
		expect(getItemFileSizeLabel(makeSkill(), 'skill')).toBeNull();
		expect(getItemFileSizeLabel(makeHook(), 'hook')).toBeNull();
	});
});

// ─── getParentDir ────────────────────────────────────────────────────────────

describe('getParentDir', () => {
	it('extracts parent from unix path', () => {
		expect(getParentDir('/home/user/.claude/skills/mp-commit.md')).toBe(
			'/home/user/.claude/skills',
		);
	});

	it('extracts parent from windows path', () => {
		expect(getParentDir('C:\\Users\\user\\.claude\\skills\\mp-commit.md')).toBe(
			'C:\\Users\\user\\.claude\\skills',
		);
	});

	it('returns null for null input', () => {
		expect(getParentDir(null)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(getParentDir('')).toBeNull();
	});

	it('returns null for mcp:// URLs', () => {
		expect(getParentDir('mcp://claude-code/user/context7')).toBeNull();
	});
});

// ─── makeMcpKey ──────────────────────────────────────────────────────────────

describe('makeMcpKey', () => {
	it('builds mcp:// key from provider/source/name', () => {
		expect(makeMcpKey({ provider: 'claude-code', source: 'user', name: 'context7' })).toBe(
			'mcp://claude-code/user/context7',
		);
	});
});

// ─── deriveLanguage ──────────────────────────────────────────────────────────

describe('deriveLanguage', () => {
	it('maps .ts to TypeScript', () => {
		expect(deriveLanguage('index.ts')).toBe('TypeScript');
	});

	it('maps .py to Python', () => {
		expect(deriveLanguage('script.py')).toBe('Python');
	});

	it('maps .md to Markdown', () => {
		expect(deriveLanguage('README.md')).toBe('Markdown');
	});

	it('maps .svelte to Svelte', () => {
		expect(deriveLanguage('App.svelte')).toBe('Svelte');
	});

	it('returns null for unknown extension', () => {
		expect(deriveLanguage('file.xyz')).toBeNull();
	});

	it('returns null for files without extension', () => {
		expect(deriveLanguage('Dockerfile')).toBeNull();
	});

	it('is case-insensitive for extension', () => {
		expect(deriveLanguage('script.PY')).toBe('Python');
	});
});

// ─── sortItems ───────────────────────────────────────────────────────────────

describe('sortItems', () => {
	const items = [
		makeSkill({ name: 'beta', source: 'project' }),
		makeSkill({ name: 'alpha', source: 'user' }),
		makeSkill({ name: 'gamma', source: 'custom' }),
	];

	it('sorts by name alphabetically', () => {
		const sorted = sortItems(items, 'name');
		expect(sorted.map((i) => (i as { name: string }).name)).toEqual(['alpha', 'beta', 'gamma']);
	});

	it('sorts by source: user → project → custom', () => {
		const sorted = sortItems(items, 'source');
		expect(sorted.map((i) => (i as { source: string }).source)).toEqual([
			'user',
			'project',
			'custom',
		]);
	});

	it('sorts by category then name', () => {
		const catItems = [
			makeSkill({ name: 'beta', category: 'workflow' }),
			makeSkill({ name: 'alpha', category: 'ci' }),
			makeSkill({ name: 'gamma', category: 'ci' }),
		];
		const sorted = sortItems(catItems, 'category');
		expect(sorted.map((i) => (i as { name: string }).name)).toEqual(['alpha', 'gamma', 'beta']);
	});

	it('does not mutate original array', () => {
		const original = [...items];
		sortItems(items, 'name');
		expect(items).toEqual(original);
	});
});

// ─── groupItems ──────────────────────────────────────────────────────────────

describe('groupItems', () => {
	const items = [
		makeSkill({ name: 'a', source: 'user', category: 'workflow' }),
		makeSkill({ name: 'b', source: 'project', category: 'ci' }),
		makeSkill({ name: 'c', source: 'user', category: 'workflow' }),
	];

	it('flat grouping puts all items under "all"', () => {
		const grouped = groupItems(items, 'flat');
		expect(grouped.size).toBe(1);
		expect(grouped.get('all')?.length).toBe(3);
	});

	it('groups by source', () => {
		const grouped = groupItems(items, 'source');
		expect(grouped.get('user')?.length).toBe(2);
		expect(grouped.get('project')?.length).toBe(1);
	});

	it('groups by category', () => {
		const grouped = groupItems(items, 'category');
		expect(grouped.get('workflow')?.length).toBe(2);
		expect(grouped.get('ci')?.length).toBe(1);
	});

	it('uses "uncategorized" for null category', () => {
		const nullCatItems = [makeSkill({ name: 'x', category: null })];
		const grouped = groupItems(nullCatItems, 'category');
		expect(grouped.has('uncategorized')).toBe(true);
	});

	it('uses "unknown" for null source', () => {
		const nullSourceItems = [makeSkill({ name: 'x', source: undefined })];
		const grouped = groupItems(nullSourceItems, 'source');
		expect(grouped.has('unknown')).toBe(true);
	});
});

// ─── findItemByPath / findKindByPath ─────────────────────────────────────────

describe('findItemByPath', () => {
	const lookupSource = {
		skills: [makeSkill({ file_path: '/a.md' }) as never],
		agents: [],
		hooks: [makeHook({ file_path: '/b.sh' }) as never],
		memories: [],
		instructions: [],
		rules: [makeRule({ file_path: '/c.md' }) as never],
	};

	it('finds skill by path', () => {
		const item = findItemByPath(lookupSource, '/a.md');
		expect(item).not.toBeNull();
		expect((item as { name: string }).name).toBe('mp-commit');
	});

	it('finds hook by path', () => {
		const item = findItemByPath(lookupSource, '/b.sh');
		expect(item).not.toBeNull();
	});

	it('returns null for unknown path', () => {
		expect(findItemByPath(lookupSource, '/unknown.md')).toBeNull();
	});

	it('returns null for null path', () => {
		expect(findItemByPath(lookupSource, null)).toBeNull();
	});

	it('returns null for null result', () => {
		expect(findItemByPath(null, '/a.md')).toBeNull();
	});
});

describe('findKindByPath', () => {
	const lookupSource = {
		skills: [makeSkill({ file_path: '/skill.md' }) as never],
		agents: [],
		hooks: [makeHook({ file_path: '/hook.sh' }) as never],
		memories: [],
		instructions: [makeInstruction({ file_path: '/inst.md' }) as never],
		rules: [makeRule({ file_path: '/rule.md' }) as never],
	};

	it('returns "skill" for skill path', () => {
		expect(findKindByPath(lookupSource, '/skill.md')).toBe('skill');
	});

	it('returns "hook" for hook path', () => {
		expect(findKindByPath(lookupSource, '/hook.sh')).toBe('hook');
	});

	it('returns "instruction" for instruction path', () => {
		expect(findKindByPath(lookupSource, '/inst.md')).toBe('instruction');
	});

	it('returns "rule" for rule path', () => {
		expect(findKindByPath(lookupSource, '/rule.md')).toBe('rule');
	});

	it('returns null for unknown path', () => {
		expect(findKindByPath(lookupSource, '/nope')).toBeNull();
	});

	it('returns null for null inputs', () => {
		expect(findKindByPath(null, '/a')).toBeNull();
		expect(findKindByPath(lookupSource, null)).toBeNull();
	});
});
