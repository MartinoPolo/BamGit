<script lang="ts">
	import { getDashboardStore } from '$lib/stores/dashboard.svelte';
	import { getGitStatusStore } from '$lib/stores/git_status.svelte';
	import { getIssueStore } from '$lib/stores/issues.svelte';
	import { getGithubStore } from '$lib/stores/github.svelte';
	import { getActionStore } from '$lib/stores/actions.svelte';
	import { getNotificationStore } from '$lib/stores/notifications.svelte';
	import { getSessionStore } from '$lib/stores/sessions.svelte';
	import { NOTIFICATION_DOT_COLORS } from '$lib/types/notification';
	import { getColorPaletteStore } from '$lib/stores/color_palettes.svelte';
	import { getViewPreferenceStore } from '$lib/stores/view_preference.svelte';
	import { FALLBACK_ISSUE_COLOR } from '$lib/types/color_palette';
	import {
		createIssue,
		archiveIssue,
		unarchiveIssue,
		updateIssue,
		deleteIssue,
	} from '$lib/tauri/issue_commands';
	import { setupWorktree, removeWorktree, getPrunableIssues } from '$lib/tauri/worktree_commands';
	import { executeAction } from '$lib/tauri/action_commands';
	import type { Issue, CreateIssueRequest, UpdateIssueRequest } from '$lib/types/issue';
	import type { Session } from '$lib/types/session';
	import type { PrunableIssue } from '$lib/types/worktree';
	import OnboardingCard from '$lib/components/OnboardingCard.svelte';
	import EmptyIssueState from '$lib/components/EmptyIssueState.svelte';
	import DashboardToolbar from '$lib/components/DashboardToolbar.svelte';
	import IssueCardList from '$lib/components/IssueCardList.svelte';
	import ForestView from '$lib/components/ForestView.svelte';
	import IssueCreateDialog from '$lib/components/IssueCreateDialog.svelte';
	import IssueEditDialog from '$lib/components/IssueEditDialog.svelte';
	import GhSetupBanner from '$lib/components/GhSetupBanner.svelte';
	import AssignedIssuesPanel from '$lib/components/AssignedIssuesPanel.svelte';
	import PruneWorktreesDialog from '$lib/components/PruneWorktreesDialog.svelte';

	const dashboardStore = getDashboardStore();
	const gitStatusStore = getGitStatusStore();
	const issueStore = getIssueStore();
	const githubStore = getGithubStore();
	const actionStore = getActionStore();
	const notificationStore = getNotificationStore();
	const sessionStore = getSessionStore();
	const paletteStore = getColorPaletteStore();
	const viewPreferenceStore = getViewPreferenceStore();

	const sessionsByIssueId = $derived.by(() => {
		const map = new Map<string, Session[]>();
		for (const session of sessionStore.sessions) {
			if (session.issue_id === null) {
				continue;
			}
			const existing = map.get(session.issue_id);
			if (existing !== undefined) {
				existing.push(session);
			} else {
				map.set(session.issue_id, [session]);
			}
		}
		return map;
	});

	function getNotificationDotColor(issueId: string): string | null {
		for (const session of sessionStore.sessions) {
			if (session.issue_id !== issueId) {
				continue;
			}
			const pendingType = notificationStore.getPendingType(session.id);
			if (pendingType !== undefined) {
				const color = NOTIFICATION_DOT_COLORS[pendingType];
				if (color !== null) {
					return color;
				}
			}
		}
		return null;
	}

	let createDialogOpen = $state(false);
	let nextAvailableColor = $state<string>(FALLBACK_ISSUE_COLOR);
	let editingIssue = $state<Issue | null>(null);
	let allExpanded = $state(false);

	// Forest view combines active issues (always) with archived issues when showArchived toggled.
	// Archived issues render as stumps via tree state engine.
	const forestIssues = $derived.by(() =>
		issueStore.showArchived
			? [...issueStore.activeIssues, ...issueStore.archivedIssues]
			: issueStore.activeIssues,
	);
	let pruneDialogOpen = $state(false);
	let prunableIssues = $state<PrunableIssue[]>([]);
	let pruneRemoving = $state(false);

	// Active palette colors for the current dashboard
	const activePaletteColors = $derived.by(() => {
		const paletteId = dashboardStore.activeDashboard?.color_palette_id ?? null;
		const palette = paletteStore.getPaletteForDashboard(paletteId);
		return palette?.colors ?? [];
	});

	// Parse "owner/repo" from dashboard's github_repo field
	const githubRepoParts = $derived.by(() => {
		const githubRepo: string | null | undefined = dashboardStore.activeDashboard?.github_repo;
		if (githubRepo == null) {
			return null;
		}
		const parts = githubRepo.split('/');
		if (parts.length !== 2) {
			return null;
		}
		return { owner: parts[0], repo: parts[1] };
	});

	// Check gh availability on mount
	$effect(() => {
		githubStore.checkAvailability();
	});

	// Load issues and GitHub caches when active dashboard changes
	let lastLoadedDashboardId = $state<string | null>(null);

	$effect(() => {
		const dashboardId = dashboardStore.activeDashboardId;
		if (dashboardId !== null && dashboardId !== lastLoadedDashboardId) {
			lastLoadedDashboardId = dashboardId;
			issueStore.loadIssues(dashboardId);
			githubStore.loadCaches(dashboardId);
			gitStatusStore.loadStatusesForDashboard(dashboardId);
			actionStore.loadActions(dashboardId);
			if (githubRepoParts) {
				githubStore.loadAssignedIssues(githubRepoParts.owner, githubRepoParts.repo);
			}
		}
	});

	async function handleSyncAll() {
		const dashboardId: string | null = dashboardStore.activeDashboardId;
		if (dashboardId === null || githubRepoParts === null) {
			return;
		}
		await githubStore.syncAll(dashboardId, githubRepoParts.owner, githubRepoParts.repo);
	}

	async function openCreateDialog() {
		createDialogOpen = true;
		const dashboardId = dashboardStore.activeDashboardId;
		if (dashboardId !== null) {
			try {
				nextAvailableColor = await paletteStore.getNextColor(dashboardId);
			} catch {
				nextAvailableColor = activePaletteColors[0] ?? FALLBACK_ISSUE_COLOR;
			}
		}
	}

	async function handleCreateIssue(request: CreateIssueRequest) {
		try {
			await createIssue(request);
			await issueStore.refresh();
		} catch (err) {
			console.error('Failed to create issue:', err);
		}
	}

	async function handleArchiveIssue(id: string) {
		try {
			await archiveIssue(id);
			await issueStore.refresh();
		} catch (err) {
			console.error('Failed to archive issue:', err);
		}
	}

	async function handleUnarchiveIssue(id: string) {
		try {
			await unarchiveIssue(id);
			await issueStore.refresh();
		} catch (err) {
			console.error('Failed to unarchive issue:', err);
		}
	}

	async function handleUpdateIssue(request: UpdateIssueRequest) {
		try {
			await updateIssue(request);
			await issueStore.refresh();
		} catch (err) {
			console.error('Failed to update issue:', err);
		}
	}

	async function handleDeleteIssue(id: string) {
		try {
			await deleteIssue(id);
			await issueStore.refresh();
		} catch (err) {
			console.error('Failed to delete issue:', err);
		}
	}

	async function handleSetupWorktree(issue: Issue) {
		const dashboard = dashboardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			console.error('Dashboard has no local_folder configured');
			return;
		}
		if (issue.branch_name == null) {
			console.error('Issue has no branch_name set');
			return;
		}
		try {
			await setupWorktree({
				issue_id: issue.id,
				branch_name: issue.branch_name,
				color: issue.color,
				working_directory: dashboard.local_folder,
				base_branch: issue.base_branch ?? dashboard.default_base_branch,
			});
		} catch (err) {
			console.error('Failed to setup worktree:', err);
		}
	}

	async function handleRemoveWorktree(issue: Issue) {
		const dashboard = dashboardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			console.error('Dashboard has no local_folder configured');
			return;
		}
		if (issue.branch_name == null) {
			console.error('Issue has no branch_name to remove');
			return;
		}
		try {
			await removeWorktree({
				issue_id: issue.id,
				branch_name: issue.branch_name,
				working_directory: dashboard.local_folder,
			});
		} catch (err) {
			console.error('Failed to remove worktree:', err);
		}
	}

	async function handleOpenPruneDialog() {
		const dashboardId = dashboardStore.activeDashboardId;
		if (dashboardId == null) {
			return;
		}
		try {
			prunableIssues = await getPrunableIssues(dashboardId);
			pruneDialogOpen = true;
		} catch (err) {
			console.error('Failed to fetch prunable issues:', err);
		}
	}

	async function handlePrune(issueIds: string[]) {
		const dashboard = dashboardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			return;
		}
		pruneRemoving = true;
		try {
			for (const issueId of issueIds) {
				const issue = issueStore.issues.find((i) => i.id === issueId);
				if (issue?.branch_name != null) {
					await removeWorktree({
						issue_id: issueId,
						branch_name: issue.branch_name,
						working_directory: dashboard.local_folder,
					});
				}
			}
			pruneDialogOpen = false;
		} catch (err) {
			console.error('Failed to prune worktrees:', err);
		} finally {
			pruneRemoving = false;
		}
	}

	async function handleExecuteAction(actionId: string, issueId: string) {
		try {
			await executeAction(actionId, issueId);
		} catch (err) {
			console.error('Failed to execute action:', err);
		}
	}
</script>

{#if dashboardStore.loading}
	<p class="text-muted-foreground">Loading...</p>
{:else if dashboardStore.dashboards.length === 0}
	<OnboardingCard
		onCreateDashboard={() => {
			dashboardStore.showCreateDialog = true;
		}}
	/>
{:else if dashboardStore.activeDashboard === null}
	<p class="text-muted-foreground">Select a dashboard from the sidebar.</p>
{:else}
	<div class="flex flex-col gap-4">
		<!-- Dashboard header -->
		<div class="flex items-center gap-2">
			<h1 class="text-xl font-semibold">{dashboardStore.activeDashboard.name}</h1>
			<span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{dashboardStore.activeDashboard.type}
			</span>
		</div>

		<!-- gh CLI setup banner -->
		{#if githubRepoParts && githubStore.availability !== 'available'}
			<GhSetupBanner availability={githubStore.availability} />
		{/if}

		<!-- Toolbar -->
		<DashboardToolbar
			sortMode={issueStore.sortMode}
			showArchived={issueStore.showArchived}
			archivedCount={issueStore.archivedIssues.length}
			{allExpanded}
			ghAvailable={githubStore.isAvailable}
			syncing={githubStore.syncing}
			onAddIssue={openCreateDialog}
			onSortChange={(mode) => issueStore.setSortMode(mode)}
			onToggleArchived={() => issueStore.toggleShowArchived()}
			onToggleExpandAll={() => (allExpanded = !allExpanded)}
			onSyncAll={githubRepoParts ? handleSyncAll : undefined}
			onPruneWorktrees={handleOpenPruneDialog}
			viewMode={viewPreferenceStore.mode}
			onViewModeChange={(mode) => (viewPreferenceStore.mode = mode)}
		/>

		<!-- Issue list or empty state -->
		{#if issueStore.loading}
			<p class="text-muted-foreground">Loading issues...</p>
		{:else if issueStore.error}
			<p class="text-destructive">Error: {issueStore.error}</p>
		{:else if issueStore.activeIssues.length === 0 && issueStore.archivedIssues.length === 0}
			<EmptyIssueState onAddIssue={openCreateDialog} />
		{:else if viewPreferenceStore.mode === 'forest'}
			<ForestView
				issues={forestIssues}
				getGitStatus={(issueId) => gitStatusStore.getStatus(issueId)}
				getSessionsForIssue={(issueId) => sessionsByIssueId.get(issueId) ?? []}
				onSelectIssue={(issue) => (editingIssue = issue)}
			/>
		{:else}
			<IssueCardList
				parentIssues={issueStore.parentIssues}
				archivedIssues={issueStore.archivedIssues}
				showArchived={issueStore.showArchived}
				isPortfolio={dashboardStore.activeDashboard.type === 'portfolio'}
				actions={actionStore.visibleActions}
				forceExpanded={allExpanded ? true : undefined}
				githubCacheMap={githubStore.cacheMap}
				ghAvailable={githubStore.isAvailable}
				getChildren={issueStore.getChildren}
				getGitStatus={(issueId) => gitStatusStore.getStatus(issueId)}
				{getNotificationDotColor}
				getProgressLines={(issueId) => issueStore.getProgressLines(issueId)}
				onArchive={handleArchiveIssue}
				onUnarchive={handleUnarchiveIssue}
				onEdit={(issue) => (editingIssue = issue)}
				onDelete={handleDeleteIssue}
				onSetupWorktree={handleSetupWorktree}
				onRemoveWorktree={handleRemoveWorktree}
				onExecuteAction={handleExecuteAction}
			/>
		{/if}

		<!-- Assigned issues panel -->
		{#if githubStore.assignedIssues.length > 0}
			<AssignedIssuesPanel
				issues={githubStore.assignedIssues}
				disabled={githubStore.isAvailable !== true}
			/>
		{/if}
	</div>

	<IssueCreateDialog
		open={createDialogOpen}
		dashboardId={dashboardStore.activeDashboard.id}
		paletteColors={activePaletteColors}
		defaultColor={nextAvailableColor}
		onClose={() => (createDialogOpen = false)}
		onCreate={handleCreateIssue}
	/>

	<IssueEditDialog
		issue={editingIssue}
		paletteColors={activePaletteColors}
		onClose={() => (editingIssue = null)}
		onUpdate={handleUpdateIssue}
	/>

	<PruneWorktreesDialog
		open={pruneDialogOpen}
		{prunableIssues}
		removing={pruneRemoving}
		onClose={() => (pruneDialogOpen = false)}
		onPrune={handlePrune}
	/>
{/if}
