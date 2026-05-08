import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import type { AiConfigDiscoveryResult, CustomDiscoveryPath } from '$lib/types/generated';

// ─── Constants ─────────────────────────────────────────────────────────────

const AI_CONFIG_TABS = [
	'skills',
	'agents',
	'hooks',
	'mcp_servers',
	'memories',
	'instructions',
] as const;
type AiConfigTab = (typeof AI_CONFIG_TABS)[number];

const TAB_LABELS: Record<AiConfigTab, string> = {
	skills: 'Skills',
	agents: 'Agents',
	hooks: 'Hooks',
	mcp_servers: 'MCP Servers',
	memories: 'Memories',
	instructions: 'Instructions',
} as const;

export { AI_CONFIG_TABS, TAB_LABELS, type AiConfigTab };

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
	let discoveryResult = $state<AiConfigDiscoveryResult | null>(null);
	let customPaths = $state<CustomDiscoveryPath[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let activeTab = $state<AiConfigTab>('skills');
	let searchQuery = $state('');
	let selectedItemPath = $state<string | null>(null);

	// ─── Filtered items per tab ────────────────────────────────────────────

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

	const filteredSkills = $derived(
		discoveryResult?.skills.filter((s) => matchesSearch(s.name, s.description)) ?? [],
	);
	const filteredAgents = $derived(
		discoveryResult?.agents.filter((a) => matchesSearch(a.name, a.description)) ?? [],
	);
	const filteredHooks = $derived(
		discoveryResult?.hooks.filter((h) => matchesSearch(h.filename, h.description)) ?? [],
	);
	const filteredMcpServers = $derived(
		discoveryResult?.mcp_servers.filter((s) => matchesSearch(s.name)) ?? [],
	);
	const filteredMemories = $derived(
		discoveryResult?.memories.filter((m) => matchesSearch(m.name, m.description)) ?? [],
	);
	const filteredInstructions = $derived(
		discoveryResult?.instructions.filter((i) => matchesSearch(i.filename)) ?? [],
	);

	const tabCounts = $derived({
		skills: filteredSkills.length,
		agents: filteredAgents.length,
		hooks: filteredHooks.length,
		mcp_servers: filteredMcpServers.length,
		memories: filteredMemories.length,
		instructions: filteredInstructions.length,
	});

	const totalCounts = $derived({
		skills: discoveryResult?.skills.length ?? 0,
		agents: discoveryResult?.agents.length ?? 0,
		hooks: discoveryResult?.hooks.length ?? 0,
		mcp_servers: discoveryResult?.mcp_servers.length ?? 0,
		memories: discoveryResult?.memories.length ?? 0,
		instructions: discoveryResult?.instructions.length ?? 0,
	});

	// ─── Actions ───────────────────────────────────────────────────────────

	async function discover(workspaceRoot?: string) {
		try {
			loading = true;
			error = null;
			discoveryResult = await invoke<AiConfigDiscoveryResult>('discover_ai_config', {
				workspaceRoot: workspaceRoot ?? null,
			});
		} catch (err) {
			error = String(err);
		} finally {
			loading = false;
		}
	}

	async function loadCustomPaths() {
		try {
			customPaths = await invoke<CustomDiscoveryPath[]>('get_custom_discovery_paths');
		} catch (err) {
			console.error('Failed to load custom discovery paths:', err);
		}
	}

	async function addCustomPath(label: string, path: string) {
		const updated = [...customPaths, { label, path }];
		await invoke('set_custom_discovery_paths', { paths: updated });
		customPaths = updated;
	}

	async function removeCustomPath(path: string) {
		const updated = customPaths.filter((p) => p.path !== path);
		await invoke('set_custom_discovery_paths', { paths: updated });
		customPaths = updated;
	}

	return {
		get discoveryResult() {
			return discoveryResult;
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
		get tabCounts() {
			return tabCounts;
		},
		get totalCounts() {
			return totalCounts;
		},

		discover,
		loadCustomPaths,
		addCustomPath,
		removeCustomPath,
	};
}
