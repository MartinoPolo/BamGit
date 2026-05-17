<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import {
		setIssueCardContext,
		type IssueCardContextProps,
		ISSUE_CARD_SETTING_DEFAULTS,
	} from './index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	interface Props {
		issue?: Partial<Issue>;
		cache?: Partial<GitStatusCache> | null;
		overrides?: Partial<IssueCardContextProps>;
		children?: Snippet;
	}

	let { issue, cache = null, overrides = {}, children }: Props = $props();

	const defaultIssue: Issue = {
		id: 'story-issue-1',
		dashboard_id: MOCK_DASHBOARDS[0].id,
		name: 'Implement dark mode toggle',
		color: '#6366f1',
		priority: 'high',
		status: 'active',
		worktree_state: 'active',
		branch_name: 'feat/dark-mode-toggle',
		base_branch: 'main',
		worktree_folder: '/projects/grovekeeper-worktrees/dark-mode-toggle',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/42',
		github_issue_number: 42,
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		character_pack_id: null,
		character_avatar: null,
		labels: [
			{ name: 'area:ui', color: '#C5DEF5' },
			{ name: 'task', color: '#0E8A16' },
		],
		is_sound_muted: false,
		sort_order: 0,
		created_at: '2026-01-01T00:00:00Z',
	};

	const defaultCache: GitStatusCache = {
		issue_id: 'story-issue-1',
		branch_status: 'up-to-date',
		pr_state: null,
		pr_number: null,
		pr_url: null,
		github_issue_state: null,
		has_local_changes: false,
		ahead_remote_count: 0,
		behind_base_count: 0,
		merge_conflict: false,
		fetched_at: '2026-01-01T00:00:00Z',
		pr_ci_status: null,
	};

	const resolvedIssue = $derived({ ...defaultIssue, ...issue } as Issue);
	const resolvedCache = $derived(
		cache === null ? null : ({ ...defaultCache, ...cache } as GitStatusCache),
	);

	const issuesCtx = setIssuesContext();
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));

	setIssueCardContext(() => ({
		issue: resolvedIssue,
		cache: resolvedCache,
		ghAvailable: true,
		notificationDotColor: null,
		prdParent: { number: 95, url: 'https://github.com/MartinoPolo/Grovekeeper/issues/95' },
		prioritiesEnabled: true,
		sessionState: null,
		visualization: undefined,
		appearanceSettings: { ...ISSUE_CARD_SETTING_DEFAULTS },
		isActive: false,
		isHovered: false,
		isBatchSelected: false,
		isModifierHeld: false,
		...overrides,
	}));
</script>

{@render children?.()}
