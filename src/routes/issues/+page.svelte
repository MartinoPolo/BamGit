<script lang="ts">
	import { onMount } from 'svelte';
	import { useBoard, FALLBACK_ISSUE_COLOR } from '$lib/modules/board/index.svelte.js';
	import { useIssues } from '$lib/modules/issues/index.svelte.js';
	import { useVersionControl } from '$lib/modules/version-control/index.svelte.js';
	import { useActions } from '$lib/modules/actions/index.svelte.js';
	import {
		useNotifications,
		NOTIFICATION_DOT_COLORS,
	} from '$lib/modules/notifications/index.svelte.js';
	import { useSessions } from '$lib/modules/sessions/index.svelte.js';
	import type {
		Issue,
		CreateIssueRequest,
		UpdateIssueRequest,
	} from '$lib/modules/issues/index.svelte.js';
	import type { PrunableIssue } from '$lib/types/generated';
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

	const boardStore = useBoard();
	const issueStore = useIssues();
	const versionControlStore = useVersionControl();
	const actionStore = useActions();
	const notificationStore = useNotifications();
	const sessionStore = useSessions();

	function getNotificationDotColor(issueId: string): string | null {
		const issueSessions = sessionStore.sessionsByIssueId.get(issueId);
		if (issueSessions === undefined) {
			return null;
		}
		for (const session of issueSessions) {
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
		const paletteId = boardStore.activeDashboard?.color_palette_id ?? null;
		const palette = boardStore.getPaletteForDashboard(paletteId);
		return palette?.colors ?? [];
	});

	// Parse "owner/repo" from dashboard's github_repo field
	const githubRepoParts = $derived.by(() => {
		const githubRepo: string | null | undefined = boardStore.activeDashboard?.github_repo;
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
	onMount(() => {
		versionControlStore.checkAvailability();
	});

	// Load issues and version control state when active dashboard changes
	let lastLoadedDashboardId = $state<string | null>(null);

	$effect(() => {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId !== null && dashboardId !== lastLoadedDashboardId) {
			lastLoadedDashboardId = dashboardId;
			issueStore.loadIssues(dashboardId);
			versionControlStore.loadStates(dashboardId);
			actionStore.loadActions(dashboardId);
			if (githubRepoParts) {
				versionControlStore.loadAssignedIssues(githubRepoParts.owner, githubRepoParts.repo);
			}
		}
	});

	async function handleSyncAll() {
		const dashboardId: string | null = boardStore.activeDashboardId;
		if (dashboardId === null || githubRepoParts === null) {
			return;
		}
		await versionControlStore.syncAll(dashboardId, githubRepoParts.owner, githubRepoParts.repo);
	}

	async function openCreateDialog() {
		createDialogOpen = true;
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId !== null) {
			try {
				nextAvailableColor = await boardStore.getNextColor(dashboardId);
			} catch {
				nextAvailableColor = activePaletteColors[0] ?? FALLBACK_ISSUE_COLOR;
			}
		}
	}

	async function handleAction(
		label: string,
		action: () => Promise<unknown>,
		refreshAfter = true,
	) {
		try {
			await action();
			if (refreshAfter) {
				await issueStore.refresh();
			}
		} catch (err) {
			console.error(`Failed to ${label}:`, err);
		}
	}

	async function handleCreateIssue(request: CreateIssueRequest) {
		await handleAction('create issue', () => issueStore.addIssue(request));
	}

	async function handleArchiveIssue(id: string) {
		await handleAction('archive issue', () => issueStore.archiveIssue(id));
	}

	async function handleUnarchiveIssue(id: string) {
		await handleAction('unarchive issue', () => issueStore.unarchiveIssue(id));
	}

	async function handleUpdateIssue(request: UpdateIssueRequest) {
		await handleAction('update issue', () => issueStore.updateIssue(request));
	}

	async function handleDeleteIssue(id: string) {
		await handleAction('delete issue', () => issueStore.removeIssue(id));
	}

	async function handleSetupWorktree(issue: Issue) {
		const dashboard = boardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			console.error('Dashboard has no local_folder configured');
			return;
		}
		if (issue.branch_name == null) {
			console.error('Issue has no branch_name set');
			return;
		}
		await handleAction(
			'setup worktree',
			() =>
				issueStore.setupWorktree({
					issue_id: issue.id,
					branch_name: issue.branch_name!,
					color: issue.color,
					working_directory: dashboard.local_folder!,
					base_branch: issue.base_branch ?? dashboard.default_base_branch,
				}),
			false,
		);
	}

	async function handleRemoveWorktree(issue: Issue) {
		const dashboard = boardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			console.error('Dashboard has no local_folder configured');
			return;
		}
		if (issue.branch_name == null) {
			console.error('Issue has no branch_name to remove');
			return;
		}
		await handleAction(
			'remove worktree',
			() =>
				issueStore.removeWorktree({
					issue_id: issue.id,
					branch_name: issue.branch_name!,
					working_directory: dashboard.local_folder!,
				}),
			false,
		);
	}

	async function handleOpenPruneDialog() {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId == null) {
			return;
		}
		try {
			prunableIssues = await issueStore.getPrunableIssues(dashboardId);
			pruneDialogOpen = true;
		} catch (err) {
			console.error('Failed to fetch prunable issues:', err);
		}
	}

	async function handlePrune(issueIds: string[]) {
		const dashboard = boardStore.activeDashboard;
		if (dashboard?.local_folder == null) {
			return;
		}
		pruneRemoving = true;
		try {
			for (const issueId of issueIds) {
				const issue = issueStore.issues.find((i) => i.id === issueId);
				if (issue?.branch_name != null) {
					await issueStore.removeWorktree({
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
		await handleAction(
			'execute action',
			() => actionStore.executeAction(actionId, issueId),
			false,
		);
	}
</script>

{#if boardStore.loading}
	<p class="text-muted-foreground">Loading...</p>
{:else if boardStore.dashboards.length === 0}
	<OnboardingCard
		onCreateDashboard={() => {
			boardStore.showCreateDialog = true;
		}}
	/>
{:else if boardStore.activeDashboard === null}
	<p class="text-muted-foreground">Select a dashboard from the sidebar.</p>
{:else}
	<div class="flex flex-col gap-4">
		<!-- Dashboard header -->
		<div class="flex items-center gap-2">
			<h1 class="text-xl font-semibold">{boardStore.activeDashboard.name}</h1>
			<span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{boardStore.activeDashboard.type}
			</span>
		</div>

		<!-- gh CLI setup banner -->
		{#if githubRepoParts && versionControlStore.ghAvailability !== 'available'}
			<GhSetupBanner availability={versionControlStore.ghAvailability} />
		{/if}

		<!-- Toolbar -->
		<DashboardToolbar
			sortMode={issueStore.sortMode}
			showArchived={issueStore.showArchived}
			archivedCount={issueStore.archivedIssues.length}
			{allExpanded}
			ghAvailable={versionControlStore.isGhAvailable}
			syncing={versionControlStore.syncing}
			onAddIssue={openCreateDialog}
			onSortChange={(mode) => issueStore.setSortMode(mode)}
			onToggleArchived={() => issueStore.toggleShowArchived()}
			onToggleExpandAll={() => (allExpanded = !allExpanded)}
			onSyncAll={githubRepoParts ? handleSyncAll : undefined}
			onPruneWorktrees={handleOpenPruneDialog}
			viewMode={boardStore.viewMode}
			onViewModeChange={(mode) => (boardStore.viewMode = mode)}
		/>

		<!-- Issue list or empty state -->
		{#if issueStore.loading}
			<p class="text-muted-foreground">Loading issues...</p>
		{:else if issueStore.error}
			<p class="text-destructive">Error: {issueStore.error}</p>
		{:else if issueStore.activeIssues.length === 0 && issueStore.archivedIssues.length === 0}
			<EmptyIssueState onAddIssue={openCreateDialog} />
		{:else if boardStore.viewMode === 'forest'}
			<ForestView
				issues={forestIssues}
				getGitStatus={(issueId) => versionControlStore.getState(issueId)}
				getSessionsForIssue={(issueId) => sessionStore.sessionsByIssueId.get(issueId) ?? []}
				onSelectIssue={(issue) => (editingIssue = issue)}
			/>
		{:else}
			<IssueCardList
				parentIssues={issueStore.parentIssues}
				archivedIssues={issueStore.archivedIssues}
				showArchived={issueStore.showArchived}
				isPortfolio={boardStore.activeDashboard.type === 'portfolio'}
				actions={actionStore.visibleActions}
				forceExpanded={allExpanded ? true : undefined}
				cacheMap={versionControlStore.stateMap}
				ghAvailable={versionControlStore.isGhAvailable}
				getChildren={issueStore.getChildren}
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
		{#if versionControlStore.assignedIssues.length > 0}
			<AssignedIssuesPanel
				issues={versionControlStore.assignedIssues}
				disabled={versionControlStore.isGhAvailable !== true}
			/>
		{/if}
	</div>

	<IssueCreateDialog
		open={createDialogOpen}
		dashboardId={boardStore.activeDashboard.id}
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
