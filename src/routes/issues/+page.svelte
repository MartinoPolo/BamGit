<script lang="ts">
	import { get_dashboard_store } from '$lib/stores/dashboard.svelte';
	import { get_git_status_store } from '$lib/stores/git_status.svelte';
	import { get_issue_store } from '$lib/stores/issues.svelte';
	import { get_github_store } from '$lib/stores/github.svelte';
	import {
		create_issue,
		archive_issue,
		unarchive_issue,
		update_issue,
		delete_issue,
	} from '$lib/tauri/issue_commands';
	import type { Issue, CreateIssueRequest, UpdateIssueRequest } from '$lib/types/issue';
	import OnboardingCard from '$lib/components/OnboardingCard.svelte';
	import EmptyIssueState from '$lib/components/EmptyIssueState.svelte';
	import DashboardToolbar from '$lib/components/DashboardToolbar.svelte';
	import IssueCardList from '$lib/components/IssueCardList.svelte';
	import IssueCreateDialog from '$lib/components/IssueCreateDialog.svelte';
	import IssueEditDialog from '$lib/components/IssueEditDialog.svelte';
	import GhSetupBanner from '$lib/components/GhSetupBanner.svelte';
	import AssignedIssuesPanel from '$lib/components/AssignedIssuesPanel.svelte';

	const dashboard_store = get_dashboard_store();
	const git_status_store = get_git_status_store();
	const issue_store = get_issue_store();
	const github_store = get_github_store();

	let create_dialog_open = $state(false);
	let editing_issue = $state<Issue | null>(null);
	let all_expanded = $state(false);

	// Parse "owner/repo" from dashboard's github_repo field
	const github_repo_parts = $derived.by(() => {
		const github_repo: string | null | undefined =
			dashboard_store.active_dashboard?.github_repo;
		if (github_repo == null) {
			return null;
		}
		const parts = github_repo.split('/');
		if (parts.length !== 2) {
			return null;
		}
		return { owner: parts[0], repo: parts[1] };
	});

	// Check gh availability on mount
	$effect(() => {
		github_store.check_availability();
	});

	// Load issues and GitHub caches when active dashboard changes
	let last_loaded_dashboard_id = $state<string | null>(null);

	$effect(() => {
		const dashboard_id = dashboard_store.active_dashboard_id;
		if (dashboard_id !== null && dashboard_id !== last_loaded_dashboard_id) {
			last_loaded_dashboard_id = dashboard_id;
			issue_store.load_issues(dashboard_id);
			github_store.load_caches(dashboard_id);
			git_status_store.load_statuses_for_dashboard(dashboard_id);
			if (github_repo_parts) {
				github_store.load_assigned_issues(github_repo_parts.owner, github_repo_parts.repo);
			}
		}
	});

	async function handle_sync_all() {
		const dashboard_id: string | null = dashboard_store.active_dashboard_id;
		if (dashboard_id === null || github_repo_parts === null) {
			return;
		}
		await github_store.sync_all(dashboard_id, github_repo_parts.owner, github_repo_parts.repo);
	}

	async function handle_create_issue(request: CreateIssueRequest) {
		try {
			await create_issue(request);
			await issue_store.refresh();
		} catch (err) {
			console.error('Failed to create issue:', err);
		}
	}

	async function handle_archive_issue(id: string) {
		try {
			await archive_issue(id);
			await issue_store.refresh();
		} catch (err) {
			console.error('Failed to archive issue:', err);
		}
	}

	async function handle_unarchive_issue(id: string) {
		try {
			await unarchive_issue(id);
			await issue_store.refresh();
		} catch (err) {
			console.error('Failed to unarchive issue:', err);
		}
	}

	async function handle_update_issue(request: UpdateIssueRequest) {
		try {
			await update_issue(request);
			await issue_store.refresh();
		} catch (err) {
			console.error('Failed to update issue:', err);
		}
	}

	async function handle_delete_issue(id: string) {
		try {
			await delete_issue(id);
			await issue_store.refresh();
		} catch (err) {
			console.error('Failed to delete issue:', err);
		}
	}
</script>

{#if dashboard_store.loading}
	<p class="text-neutral-500">Loading...</p>
{:else if dashboard_store.dashboards.length === 0}
	<OnboardingCard
		on_create_dashboard={() => {
			dashboard_store.show_create_dialog = true;
		}}
	/>
{:else if dashboard_store.active_dashboard === null}
	<p class="text-neutral-500">Select a dashboard from the sidebar.</p>
{:else}
	<div class="flex flex-col gap-4">
		<!-- Dashboard header -->
		<div class="flex items-center gap-2">
			<h1 class="text-xl font-semibold">{dashboard_store.active_dashboard.name}</h1>
			<span class="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
				{dashboard_store.active_dashboard.type}
			</span>
		</div>

		<!-- gh CLI setup banner -->
		{#if github_repo_parts && github_store.availability !== 'available'}
			<GhSetupBanner availability={github_store.availability} />
		{/if}

		<!-- Toolbar -->
		<DashboardToolbar
			sort_mode={issue_store.sort_mode}
			show_archived={issue_store.show_archived}
			archived_count={issue_store.archived_issues.length}
			{all_expanded}
			gh_available={github_store.is_available}
			syncing={github_store.syncing}
			on_add_issue={() => (create_dialog_open = true)}
			on_sort_change={(mode) => issue_store.set_sort_mode(mode)}
			on_toggle_archived={() => issue_store.toggle_show_archived()}
			on_toggle_expand_all={() => (all_expanded = !all_expanded)}
			on_sync_all={github_repo_parts ? handle_sync_all : undefined}
		/>

		<!-- Issue list or empty state -->
		{#if issue_store.loading}
			<p class="text-neutral-500">Loading issues...</p>
		{:else if issue_store.error}
			<p class="text-red-400">Error: {issue_store.error}</p>
		{:else if issue_store.active_issues.length === 0 && issue_store.archived_issues.length === 0}
			<EmptyIssueState on_add_issue={() => (create_dialog_open = true)} />
		{:else}
			<IssueCardList
				parent_issues={issue_store.parent_issues}
				archived_issues={issue_store.archived_issues}
				show_archived={issue_store.show_archived}
				is_portfolio={dashboard_store.active_dashboard.type === 'portfolio'}
				force_expanded={all_expanded ? true : undefined}
				github_cache_map={github_store.cache_map}
				gh_available={github_store.is_available}
				get_children={issue_store.get_children}
				get_git_status={(issue_id) => git_status_store.get_status(issue_id)}
				on_archive={handle_archive_issue}
				on_unarchive={handle_unarchive_issue}
				on_edit={(issue) => (editing_issue = issue)}
				on_delete={handle_delete_issue}
			/>
		{/if}

		<!-- Assigned issues panel -->
		{#if github_store.assigned_issues.length > 0}
			<AssignedIssuesPanel
				issues={github_store.assigned_issues}
				disabled={github_store.is_available !== true}
			/>
		{/if}
	</div>

	<IssueCreateDialog
		open={create_dialog_open}
		dashboard_id={dashboard_store.active_dashboard.id}
		on_close={() => (create_dialog_open = false)}
		on_create={handle_create_issue}
	/>

	<IssueEditDialog
		issue={editing_issue}
		on_close={() => (editing_issue = null)}
		on_update={handle_update_issue}
	/>
{/if}
