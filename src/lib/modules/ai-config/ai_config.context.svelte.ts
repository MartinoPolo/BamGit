import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import { Persisted, jsonSerde, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import { makeMcpKey } from './ai_config.helpers.js';
import type {
	AiConfigDiscoveryResult,
	CustomDiscoveryPath,
	InstalledProvider,
	ProviderKind,
} from '$lib/types/generated';

// ─── Constants ─────────────────────────────────────────────────────────────

export const ALL_TABS = [
	'all',
	'skills',
	'agents',
	'hooks',
	'mcp_servers',
	'rules',
	'memories',
	'instructions',
	'settings',
] as const;
export type AiConfigTab = (typeof ALL_TABS)[number];

export const TAB_LABELS: Record<AiConfigTab, string> = {
	all: 'All',
	skills: 'Skills',
	agents: 'Agents',
	hooks: 'Hooks',
	mcp_servers: 'MCP Servers',
	rules: 'Rules',
	memories: 'Memories',
	instructions: 'Instructions',
	settings: 'Settings',
} as const;

export const PROVIDER_TAB_VISIBILITY = {
	'claude-code': [
		'skills',
		'agents',
		'hooks',
		'mcp_servers',
		'rules',
		'memories',
		'instructions',
		'settings',
	],
	'open-code': ['skills', 'agents', 'mcp_servers', 'rules', 'instructions', 'settings'],
	codex: ['skills', 'agents', 'hooks', 'mcp_servers', 'memories', 'instructions', 'settings'],
	cursor: ['skills', 'mcp_servers', 'rules', 'instructions', 'settings'],
} as const satisfies Record<ProviderKind, readonly AiConfigTab[]>;

export type ViewMode = 'card' | 'list';

export type SortBy = 'name' | 'source' | 'category';

export type GroupBy = 'flat' | 'source' | 'category';

// ─── Type Guards ────────────────────────────────────────────────────────────

function isProviderKind(value: unknown): value is ProviderKind {
	return (
		value === 'claude-code' || value === 'open-code' || value === 'codex' || value === 'cursor'
	);
}

function isViewModeRecord(value: unknown): value is Record<string, ViewMode> {
	return (
		typeof value === 'object' &&
		value !== null &&
		Object.values(value as Record<string, unknown>).every((x) => x === 'card' || x === 'list')
	);
}

function isSortByRecord(value: unknown): value is Record<string, SortBy> {
	return (
		typeof value === 'object' &&
		value !== null &&
		Object.values(value as Record<string, unknown>).every(
			(x) => x === 'name' || x === 'source' || x === 'category',
		)
	);
}

function isGroupByRecord(value: unknown): value is Record<string, GroupBy> {
	return (
		typeof value === 'object' &&
		value !== null &&
		Object.values(value as Record<string, unknown>).every(
			(x) => x === 'flat' || x === 'source' || x === 'category',
		)
	);
}

function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

// ─── Context ───────────────────────────────────────────────────────────────

type AiConfigContext = ReturnType<typeof createAiConfigContext>;

const [useAiConfig, setAiConfigInternal] = createContext<AiConfigContext>();
export { useAiConfig };

export function setAiConfigContext() {
	const context = createAiConfigContext();
	setAiConfigInternal(context);
	return context;
}

// ─── Factory ───────────────────────────────────────────────────────────────

// fallow-ignore-next-line complexity
function createAiConfigContext() {
	// ─── Persisted provider selection ─────────────────────────────────────

	const provider = new Persisted<ProviderKind>({
		key: 'ai-config:provider',
		serde: stringSerde(isProviderKind),
		defaultValue: 'claude-code',
	});

	// ─── Persisted view/sort/group per tab ────────────────────────────────

	const viewModes = new Persisted<Record<string, ViewMode>>({
		key: 'ai-config:viewModes',
		serde: jsonSerde(isViewModeRecord),
		defaultValue: {},
	});

	const sortBys = new Persisted<Record<string, SortBy>>({
		key: 'ai-config:sortBys',
		serde: jsonSerde(isSortByRecord),
		defaultValue: {},
	});

	const groupBys = new Persisted<Record<string, GroupBy>>({
		key: 'ai-config:groupBys',
		serde: jsonSerde(isGroupByRecord),
		defaultValue: {},
	});

	const showDeprecated = new Persisted<boolean>({
		key: 'ai-config:showDeprecated',
		serde: jsonSerde(isBoolean),
		defaultValue: false,
	});

	// ─── Ephemeral state ──────────────────────────────────────────────────

	let discoveryResult = $state<AiConfigDiscoveryResult | null>(null);
	let installedProviders = $state<InstalledProvider[]>([]);
	let customPaths = $state<CustomDiscoveryPath[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let activeTab = $state<AiConfigTab>('skills');
	let searchQuery = $state('');
	let selectedItemPath = $state<string | null>(null);
	let editingItemPath = $state<string | null>(null);
	let deletingItemPath = $state<string | null>(null);
	let sourcesExpanded = $state(false);
	let workspaceRoot: string | undefined;

	// ─── Search helper ────────────────────────────────────────────────────

	function matchesSearch(name: string, description?: string | null): boolean {
		if (searchQuery === '') {
			return true;
		}
		const query = searchQuery.toLowerCase();
		return (
			name.toLowerCase().includes(query) ||
			(description?.toLowerCase().includes(query) ?? false)
		);
	}

	function matchesDeprecated(deprecated: boolean): boolean {
		if (showDeprecated.current) {
			return true;
		}
		return !deprecated;
	}

	// ─── Filtered item lists ──────────────────────────────────────────────

	const filteredSkills = $derived(
		discoveryResult?.skills.filter(
			(s) => matchesSearch(s.name, s.description) && matchesDeprecated(s.deprecated),
		) ?? [],
	);

	const filteredAgents = $derived(
		discoveryResult?.agents.filter(
			(a) => matchesSearch(a.name, a.description) && matchesDeprecated(a.deprecated),
		) ?? [],
	);

	const filteredHooks = $derived(
		discoveryResult?.hooks.filter(
			(h) => matchesSearch(h.filename, h.description) && matchesDeprecated(h.deprecated),
		) ?? [],
	);

	const filteredMcpServers = $derived(
		discoveryResult?.mcp_servers.filter(
			(s) => matchesSearch(s.name) && matchesDeprecated(s.deprecated),
		) ?? [],
	);

	const filteredMemories = $derived(
		discoveryResult?.memories.filter(
			(m) => matchesSearch(m.name, m.description) && matchesDeprecated(m.deprecated),
		) ?? [],
	);

	const filteredInstructions = $derived(
		discoveryResult?.instructions.filter(
			(i) => matchesSearch(i.filename) && matchesDeprecated(i.deprecated),
		) ?? [],
	);

	const filteredRules = $derived(
		discoveryResult?.rules.filter(
			(r) => matchesSearch(r.filename, r.description) && matchesDeprecated(r.deprecated),
		) ?? [],
	);

	// ─── Counts ───────────────────────────────────────────────────────────

	const tabCounts = $derived({
		all:
			filteredSkills.length +
			filteredAgents.length +
			filteredHooks.length +
			filteredMcpServers.length +
			filteredMemories.length +
			filteredInstructions.length +
			filteredRules.length,
		skills: filteredSkills.length,
		agents: filteredAgents.length,
		hooks: filteredHooks.length,
		mcp_servers: filteredMcpServers.length,
		rules: filteredRules.length,
		memories: filteredMemories.length,
		instructions: filteredInstructions.length,
		settings: 0,
	});

	// ─── Visible tabs ─────────────────────────────────────────────────────

	const visibleTabs = $derived.by(() => {
		const baseTabs = PROVIDER_TAB_VISIBILITY[provider.current];
		const tabs: AiConfigTab[] = [];
		if (searchQuery !== '') {
			tabs.push('all');
		}
		for (const tab of baseTabs) {
			if (tab !== 'settings') {
				tabs.push(tab);
			}
		}
		if ((baseTabs as readonly string[]).includes('settings')) {
			tabs.push('settings');
		}
		return tabs;
	});

	// ─── Selected item ────────────────────────────────────────────────────

	const selectedItem = $derived.by(() => {
		if (selectedItemPath === null || discoveryResult === null) {
			return null;
		}
		const allItems = [
			...discoveryResult.skills,
			...discoveryResult.agents,
			...discoveryResult.hooks,
			...discoveryResult.mcp_servers.map((s) => ({
				...s,
				file_path: makeMcpKey(s),
			})),
			...discoveryResult.memories,
			...discoveryResult.instructions,
			...discoveryResult.rules,
		];
		return allItems.find((item) => item.file_path === selectedItemPath) ?? null;
	});

	// ─── Per-tab view/sort/group helpers ──────────────────────────────────

	function viewModeFor(tab: AiConfigTab): ViewMode {
		return viewModes.current[tab] ?? 'card';
	}

	function setViewModeFor(tab: AiConfigTab, mode: ViewMode): void {
		viewModes.current = { ...viewModes.current, [tab]: mode };
	}

	function sortByFor(tab: AiConfigTab): SortBy {
		return sortBys.current[tab] ?? 'name';
	}

	function setSortByFor(tab: AiConfigTab, sort: SortBy): void {
		sortBys.current = { ...sortBys.current, [tab]: sort };
	}

	function groupByFor(tab: AiConfigTab): GroupBy {
		return groupBys.current[tab] ?? 'flat';
	}

	function setGroupByFor(tab: AiConfigTab, group: GroupBy): void {
		groupBys.current = { ...groupBys.current, [tab]: group };
	}

	// ─── Actions ──────────────────────────────────────────────────────────

	async function discover(root?: string): Promise<void> {
		loading = true;
		error = null;
		try {
			discoveryResult = await invoke<AiConfigDiscoveryResult>('discover_ai_config', {
				provider: provider.current,
				workspaceRoot: root ?? null,
			});
		} catch (err) {
			error = String(err);
		} finally {
			loading = false;
		}
	}

	async function loadInstalledProviders(): Promise<void> {
		try {
			installedProviders = await invoke<InstalledProvider[]>('detect_installed_providers');
		} catch (err) {
			console.error('Failed to load installed providers:', err);
		}
	}

	async function loadCustomPaths(): Promise<void> {
		try {
			customPaths = await invoke<CustomDiscoveryPath[]>('get_custom_discovery_paths');
		} catch (err) {
			console.error('Failed to load custom discovery paths:', err);
		}
	}

	async function init(root: string | undefined): Promise<void> {
		workspaceRoot = root;
		await Promise.all([loadInstalledProviders(), loadCustomPaths()]);
		await discover(root);
	}

	async function setProvider(kind: ProviderKind): Promise<void> {
		provider.current = kind;
		await discover(workspaceRoot);
	}

	async function addCustomPath(label: string, path: string): Promise<void> {
		const updated = [...customPaths, { provider: provider.current, label, path }];
		await invoke('set_custom_discovery_paths', { paths: updated });
		customPaths = updated;
	}

	async function removeCustomPath(path: string): Promise<void> {
		const updated = customPaths.filter((p) => p.path !== path);
		await invoke('set_custom_discovery_paths', { paths: updated });
		customPaths = updated;
	}

	async function setSkillOverride(
		skillWorkspaceRoot: string,
		skillName: string,
		value: string,
	): Promise<void> {
		await invoke('set_skill_override', {
			workspaceRoot: skillWorkspaceRoot,
			skillName,
			value,
		});
		if (discoveryResult !== null) {
			const skill = discoveryResult.skills.find((s) => s.name === skillName);
			if (skill !== undefined) {
				skill.skill_override = value === 'on' ? null : value;
			}
		}
	}

	async function writeFile(path: string, content: string): Promise<void> {
		await invoke('write_ai_config_file', { path, content });
		await discover(workspaceRoot);
	}

	async function deleteFile(path: string): Promise<void> {
		await invoke('delete_ai_config_file', { path });
		await discover(workspaceRoot);
	}

	async function deleteHook(
		settingsPath: string,
		eventType: string,
		matcher: string,
		command: string,
	): Promise<void> {
		await invoke('delete_hook_from_settings', { settingsPath, eventType, matcher, command });
		await discover(workspaceRoot);
	}

	async function deleteMcp(filePath: string, kind: string, name: string): Promise<void> {
		await invoke('delete_mcp_from_settings', { filePath, kind, name });
		await discover(workspaceRoot);
	}

	return {
		get provider() {
			return provider.current;
		},
		get discoveryResult() {
			return discoveryResult;
		},
		get installedProviders() {
			return installedProviders;
		},
		get customPaths() {
			return customPaths;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get activeTab() {
			return activeTab;
		},
		set activeTab(tab: AiConfigTab) {
			activeTab = tab;
			selectedItemPath = null;
		},
		get searchQuery() {
			return searchQuery;
		},
		set searchQuery(query: string) {
			searchQuery = query;
		},
		get selectedItemPath() {
			return selectedItemPath;
		},
		set selectedItemPath(path: string | null) {
			selectedItemPath = path;
		},
		get editingItemPath() {
			return editingItemPath;
		},
		set editingItemPath(path: string | null) {
			editingItemPath = path;
		},
		get deletingItemPath() {
			return deletingItemPath;
		},
		set deletingItemPath(path: string | null) {
			deletingItemPath = path;
		},
		get sourcesExpanded() {
			return sourcesExpanded;
		},
		set sourcesExpanded(value: boolean) {
			sourcesExpanded = value;
		},
		get showDeprecated() {
			return showDeprecated.current;
		},
		set showDeprecated(value: boolean) {
			showDeprecated.current = value;
		},
		get filteredSkills() {
			return filteredSkills;
		},
		get filteredAgents() {
			return filteredAgents;
		},
		get filteredHooks() {
			return filteredHooks;
		},
		get filteredMcpServers() {
			return filteredMcpServers;
		},
		get filteredMemories() {
			return filteredMemories;
		},
		get filteredInstructions() {
			return filteredInstructions;
		},
		get filteredRules() {
			return filteredRules;
		},
		get tabCounts() {
			return tabCounts;
		},
		get visibleTabs() {
			return visibleTabs;
		},
		get selectedItem() {
			return selectedItem;
		},
		viewModeFor,
		setViewModeFor,
		sortByFor,
		setSortByFor,
		groupByFor,
		setGroupByFor,
		init,
		setProvider,
		discover,
		loadInstalledProviders,
		loadCustomPaths,
		addCustomPath,
		removeCustomPath,
		setSkillOverride,
		writeFile,
		deleteFile,
		deleteHook,
		deleteMcp,
		get workspaceRoot() {
			return workspaceRoot;
		},
	};
}
