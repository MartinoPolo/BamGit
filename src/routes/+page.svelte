<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { onMount, untrack } from 'svelte';
	import { useBoard, useSelection, FALLBACK_ISSUE_COLOR } from '$lib/modules/board';
	import { useIssues } from '$lib/modules/issues';
	import { useVersionControl } from '$lib/modules/version-control';
	import { useActions } from '$lib/modules/actions';
	import {
		useNotifications,
		NOTIFICATION_DOT_COLORS,
		findNotificationDotColor,
	} from '$lib/modules/notifications';
	import { useSessions } from '$lib/modules/sessions';
	import { useRawRequirements } from '$lib/modules/raw-requirements/index.js';
	import { useToasts } from '$lib/modules/toasts/index.js';
	import type {
		Issue,
		IssuePriority,
		CreateIssueRequest,
		UpdateIssueRequest,
	} from '$lib/modules/issues';
	import OnboardingCard from '$lib/components/OnboardingCard.svelte';
	import EmptyIssueState from '$lib/components/EmptyIssueState.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import ForestView from '$lib/components/ForestView.svelte';
	import WorkspaceDashboardLayout from '$lib/components/WorkspaceDashboardLayout.svelte';
	import WorkspaceBottomPanel from '$lib/components/WorkspaceBottomPanel.svelte';
	import { computeVisualization } from '$lib/modules/visualization';
	import type { TreeVisualization, SessionForMapping } from '$lib/modules/visualization';
	import { CreationWizard } from '$lib/components/creation-wizard/index.js';
	import { useCreationWizard, type WizardDependencies } from '$lib/modules/creation-wizard';
	import IssueEditDialog from '$lib/components/IssueEditDialog.svelte';
	import ArchiveConfirmDialog from '$lib/components/ArchiveConfirmDialog.svelte';
	import DeleteConfirmDialog from '$lib/components/DeleteConfirmDialog.svelte';
	import IssueRenameDialog from '$lib/components/IssueRenameDialog.svelte';
	import PruneWorktreesDialog from '$lib/components/PruneWorktreesDialog.svelte';
	import ColorChangeDialog from '$lib/components/ColorChangeDialog.svelte';
	import type { AssignedIssue, PrunableIssue } from '$lib/types/generated';
	import { invoke } from '$lib/tauri.js';
	import GitHubAuthWizard from '$lib/components/GitHubAuthWizard.svelte';

	const boardStore = useBoard();
	const issueStore = useIssues();
	const versionControlStore = useVersionControl();
	const actionStore = useActions();
	const notificationStore = useNotifications();
	const sessionStore = useSessions();
	const selection = useSelection();
	const rawRequirementsCtx = useRawRequirements();
	const wizardStore = useCreationWizard();
	const toastsCtx = useToasts();

	function getNotificationDotColor(issueId: string): string | null {
		const issueSessions = sessionStore.sessionsByIssueId.get(issueId);
		if (issueSessions === undefined) {
			return null;
		}
		return findNotificationDotColor(
			issueSessions.map((s) => s.id),
			(id) => notificationStore.getPendingType(id),
			NOTIFICATION_DOT_COLORS,
		);
	}

	let usedColors = $state<string[]>([]);
	let editingIssue = $state<Issue | null>(null);

	let pruneDialogOpen = $state(false);
	let prunableIssues = $state<PrunableIssue[]>([]);
	let pruneRemoving = $state(false);

	let archiveTargetIssue = $state<Issue | null>(null);
	let deleteTargetIssue = $state<Issue | null>(null);
	let renameTargetIssue = $state<Issue | null>(null);
	let colorChangeTargetIssue = $state<Issue | null>(null);
	let authWizardOpen = $state(false);

	const archiveUnfinishedSessionCount = $derived.by(() => {
		if (archiveTargetIssue === null) {
			return 0;
		}
		const sessions = sessionStore.sessionsByIssueId.get(archiveTargetIssue.id);
		if (sessions === undefined) {
			return 0;
		}
		return sessions.filter((s) => s.state !== 'finished' && s.state !== 'errored').length;
	});

	const archiveOpenPrCount = $derived.by(() => {
		if (archiveTargetIssue === null) {
			return 0;
		}
		const gitState = versionControlStore.getState(archiveTargetIssue.id);
		if (gitState?.pr_state == null) {
			return 0;
		}
		const closedStates = ['merged', 'closed'];
		return closedStates.includes(gitState.pr_state) ? 0 : 1;
	});

	const forestIssues = $derived.by(() =>
		issueStore.showArchived
			? [...issueStore.activeIssues, ...issueStore.archivedIssues]
			: issueStore.activeIssues,
	);

	const activePaletteColors = $derived.by(() => {
		const paletteId = boardStore.activeDashboard?.color_palette_id ?? null;
		const palette = boardStore.getPaletteForDashboard(paletteId);
		return palette?.colors ?? [];
	});

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

	onMount(() => {
		versionControlStore.checkAvailability();
	});

	$effect(() => {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId === null) {
			return;
		}
		untrack(() => {
			issueStore.loadIssues(dashboardId);
			versionControlStore.loadStates(dashboardId);
			actionStore.loadActions(dashboardId);
			if (githubRepoParts) {
				versionControlStore.loadAssignedIssues(githubRepoParts.owner, githubRepoParts.repo);
			}
		});
	});

	async function handleSyncAll() {
		const dashboardId: string | null = boardStore.activeDashboardId;
		if (dashboardId === null || githubRepoParts === null) {
			return;
		}
		await versionControlStore.syncAll(dashboardId, githubRepoParts.owner, githubRepoParts.repo);
	}

	async function loadUsedColors(): Promise<void> {
		usedColors = [];
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId !== null) {
			try {
				usedColors = await boardStore.getUsedColors(dashboardId);
			} catch {
				usedColors = [];
			}
		}
	}

	async function fetchNextColor(dashboardId: string): Promise<string> {
		try {
			const [color] = await Promise.all([
				boardStore.getNextColor(dashboardId),
				loadUsedColors(),
			]);
			return color;
		} catch {
			return activePaletteColors[0] ?? FALLBACK_ISSUE_COLOR;
		}
	}

	function buildWizardDependencies(dashboardId: string, nextColor: string): WizardDependencies {
		return {
			dashboardId,
			paletteColors: activePaletteColors,
			usedColors,
			nextAvailableColor: nextColor,
			localFolder: boardStore.activeDashboard?.local_folder ?? null,
			defaultBaseBranch: boardStore.activeDashboard?.default_base_branch ?? null,
			githubRepo: githubRepoParts,
			assignedIssues: versionControlStore.assignedIssues,
		};
	}

	async function openCreateDialog() {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId === null) {
			return;
		}
		const nextColor = await fetchNextColor(dashboardId);
		wizardStore.openWizard(buildWizardDependencies(dashboardId, nextColor));
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
			toastsCtx.show({
				tone: 'danger',
				title: `Failed to ${label}`,
				body: String(err),
			});
		}
	}

	async function handleWizardCreate(request: CreateIssueRequest): Promise<Issue> {
		const issue = await issueStore.addIssue(request);
		await issueStore.refresh();
		return issue;
	}

	async function handleWizardUpdate(request: UpdateIssueRequest): Promise<Issue> {
		const issue = await issueStore.updateIssue(request);
		await issueStore.refresh();
		return issue;
	}

	async function handleWizardSetupWorktree(issue: Issue): Promise<void> {
		const dashboard = boardStore.activeDashboard;
		if (dashboard?.local_folder == null || issue.branch_name == null) {
			return;
		}
		await issueStore.setupWorktree({
			issue_id: issue.id,
			branch_name: issue.branch_name,
			color: issue.color,
			working_directory: dashboard.local_folder,
			base_branch: issue.base_branch ?? dashboard.default_base_branch,
		});
	}

	async function handleWizardOpenWithIssue(assignedIssue: AssignedIssue) {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId === null) {
			return;
		}
		const nextColor = await fetchNextColor(dashboardId);
		wizardStore.openWizardWithPreselectedIssue(
			buildWizardDependencies(dashboardId, nextColor),
			assignedIssue,
		);
	}

	async function quickCreateFromAssigned(dashboardId: string, assignedIssue: AssignedIssue) {
		const nextColor = await fetchNextColor(dashboardId);
		const { generateIssueName, generateBranchName } =
			await import('$lib/modules/creation-wizard');

		const issue = await issueStore.addIssue({
			dashboard_id: dashboardId,
			name: generateIssueName(assignedIssue.number, assignedIssue.title),
			color: nextColor,
			priority: 'medium',
			github_issue_url: assignedIssue.url,
			github_issue_number: assignedIssue.number,
		});

		const branchName = generateBranchName(assignedIssue.number, assignedIssue.title);
		await issueStore.updateIssue({
			id: issue.id,
			branch_name: branchName,
			base_branch: boardStore.activeDashboard?.default_base_branch ?? null,
		});
		await issueStore.refresh();
		return { issue, branchName };
	}

	async function handleQuickAddWithWorktree(assignedIssue: AssignedIssue) {
		const dashboardId = boardStore.activeDashboardId;
		if (dashboardId === null) {
			return;
		}
		try {
			const { issue, branchName } = await quickCreateFromAssigned(dashboardId, assignedIssue);
			const localFolder = boardStore.activeDashboard?.local_folder;
			if (localFolder != null) {
				await issueStore.setupWorktree({
					issue_id: issue.id,
					branch_name: branchName,
					color: issue.color,
					working_directory: localFolder,
					base_branch:
						issue.base_branch ?? boardStore.activeDashboard?.default_base_branch,
				});
			}
		} catch (error) {
			console.error('Quick add with worktree failed:', error);
		}
	}

	function handleLoadMoreAssignedIssues() {
		if (githubRepoParts === null) {
			return;
		}
		void versionControlStore.loadMoreAssignedIssues(
			githubRepoParts.owner,
			githubRepoParts.repo,
		);
	}

	function handleRefreshAssignedIssues() {
		if (githubRepoParts === null) {
			return;
		}
		void versionControlStore.loadAssignedIssues(githubRepoParts.owner, githubRepoParts.repo);
	}

	async function handleUnarchiveIssue(id: string) {
		await handleAction('unarchive issue', () => issueStore.unarchiveIssue(id));
	}

	async function handleUpdateIssue(request: UpdateIssueRequest) {
		await handleAction('update issue', () => issueStore.updateIssue(request));
	}

	async function handleChangePriority(id: string, priority: IssuePriority | null) {
		await handleAction('change priority', () => issueStore.updateIssue({ id, priority }));
	}

	async function handleArchiveConfirm(removeWorktree: boolean) {
		const issue = archiveTargetIssue;
		if (issue === null) {
			return;
		}
		archiveTargetIssue = null;

		if (removeWorktree) {
			await handleRemoveWorktree(issue);
		}
		await handleAction('archive issue', () => issueStore.archiveIssue(issue.id));
	}

	async function handleDeleteConfirm(removeWorktree: boolean) {
		const issue = deleteTargetIssue;
		if (issue === null) {
			return;
		}
		deleteTargetIssue = null;

		if (removeWorktree) {
			await handleRemoveWorktree(issue);
		}
		await handleAction('delete issue', () => issueStore.removeIssue(issue.id));
	}

	async function handleRename(id: string, name: string) {
		await handleAction('rename issue', () => issueStore.updateIssue({ id, name }));
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

	async function handleExecuteAction(actionId: string, issueId: string) {
		await handleAction(
			'execute action',
			() => actionStore.executeAction(actionId, issueId),
			false,
		);
	}

	async function handleChangeColor(issueId: string, newColor: string) {
		await handleAction('change color', async () => {
			const updatedIssue = await issueStore.updateIssue({ id: issueId, color: newColor });
			await loadUsedColors();
			if (updatedIssue.worktree_folder != null && updatedIssue.worktree_state === 'active') {
				await invoke('update_peacock_color', {
					worktreeFolder: updatedIssue.worktree_folder,
					color: newColor,
				});
			}
		});
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
						working_directory: dashboard.local_folder!,
					});
				}
			}
		} catch (err) {
			console.error('Failed to prune worktrees:', err);
		} finally {
			pruneDialogOpen = false;
			pruneRemoving = false;
		}
	}

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- intentionally non-reactive perf cache
	const cardVisualizationCache = new Map<
		string,
		{ fingerprint: string; result: TreeVisualization }
	>();

	function getVisualization(issueId: string): TreeVisualization | undefined {
		const issue = forestIssues.find((i) => i.id === issueId);
		if (issue === undefined) {
			return undefined;
		}
		const gitStatus = versionControlStore.getState(issueId);
		const sessions = sessionStore.sessionsByIssueId.get(issueId) ?? [];
		const fingerprint = `${issue.status}|${issue.worktree_state}|${issue.color}|${issue.labels.map((l) => l.name).join(',')}|${gitStatus?.branch_status}|${gitStatus?.pr_state}|${sessions.map((s) => s.state).join(',')}`;
		const cached = cardVisualizationCache.get(issueId);
		if (cached && cached.fingerprint === fingerprint) {
			return cached.result;
		}
		const result = computeVisualization(issue, gitStatus, sessions);
		cardVisualizationCache.set(issueId, { fingerprint, result });
		return result;
	}

	function getGitStatusForForest(issueId: string) {
		return versionControlStore.getState(issueId);
	}

	function getSessionsForForest(issueId: string): readonly SessionForMapping[] {
		return sessionStore.sessionsByIssueId.get(issueId) ?? [];
	}

	function handlePageKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			selection.deactivate();
		}
	}
</script>

<svelte:window onkeydown={handlePageKeydown} />

{#if boardStore.loading}
	<p class="text-muted-foreground">{m.loading()}</p>
{:else if boardStore.dashboards.length === 0}
	<OnboardingCard
		onCreateDashboard={() => {
			boardStore.showCreateDialog = true;
		}}
	/>
{:else if boardStore.activeDashboard === null}
	<p class="text-muted-foreground">{m.select_dashboard()}</p>
{:else}
	<TopBar
		title={boardStore.activeDashboard.name}
		subtitle="{boardStore.activeDashboard.type} · {issueStore.activeIssues.length} issues"
		forestCollapsed={selection.forestCollapsed}
		syncing={versionControlStore.syncing}
		onSync={githubRepoParts ? handleSyncAll : undefined}
		onQuickIdeas={() => void rawRequirementsCtx.toggle()}
		onCreateIssue={openCreateDialog}
		onToggleForest={() => selection.toggleForestCollapsed()}
	/>

	{#if issueStore.loading}
		<div class="p-5">
			<p class="text-muted-foreground">{m.loading_issues()}</p>
		</div>
	{:else if issueStore.error}
		<div class="p-5">
			<p class="text-destructive">{m.error_prefix({ message: issueStore.error })}</p>
		</div>
	{:else if issueStore.activeIssues.length === 0 && issueStore.archivedIssues.length === 0}
		<div class="p-5">
			<EmptyIssueState onAddIssue={openCreateDialog} />
		</div>
	{:else}
		<div class="flex-1 overflow-hidden">
			<WorkspaceDashboardLayout
				collapsed={selection.forestCollapsed}
				onToggle={(value) => {
					if (value !== selection.forestCollapsed) {
						selection.toggleForestCollapsed();
					}
				}}
			>
				{#snippet forestPanel()}
					<ForestView
						issues={forestIssues}
						allIssues={issueStore.issues}
						dependencies={issueStore.dependencies}
						getGitStatus={getGitStatusForForest}
						getSessionsForIssue={getSessionsForForest}
						onAddIssue={openCreateDialog}
						onArchiveIssue={(issue) => (archiveTargetIssue = issue)}
						onChangeIssueColor={async (issueId) => {
							const issue = issueStore.issues.find((i) => i.id === issueId);
							if (issue) {
								await loadUsedColors();
								colorChangeTargetIssue = issue;
							}
						}}
					/>
				{/snippet}
				{#snippet bottomPanel()}
					<WorkspaceBottomPanel
						issues={forestIssues}
						parentIssues={issueStore.parentIssues}
						archivedIssues={issueStore.archivedIssues}
						showArchived={issueStore.showArchived}
						isPortfolio={boardStore.activeDashboard?.type === 'portfolio'}
						cacheMap={versionControlStore.stateMap}
						ghAvailable={versionControlStore.isGhAvailable}
						prioritiesEnabled={boardStore.activeDashboard?.priorities_enabled ?? true}
						paletteColors={activePaletteColors}
						{usedColors}
						dependencies={issueStore.dependencies}
						authStatus={versionControlStore.authStatus}
						onconnect={() => (authWizardOpen = true)}
						assignedIssues={versionControlStore.assignedIssues}
						assignedIssuesHasMore={versionControlStore.assignedIssuesHasMore}
						assignedIssuesLoading={versionControlStore.assignedIssuesLoading}
						assignedIssuesLastSynced={versionControlStore.assignedIssuesLastSynced}
						{getVisualization}
						getChildren={issueStore.getChildren}
						{getNotificationDotColor}
						onArchive={(issue) => (archiveTargetIssue = issue)}
						onUnarchive={handleUnarchiveIssue}
						onEdit={async (issue) => {
							await loadUsedColors();
							editingIssue = issue;
						}}
						onDelete={(issue) => (deleteTargetIssue = issue)}
						onChangePriority={handleChangePriority}
						onRename={(issue) => (renameTargetIssue = issue)}
						onSetupWorktree={handleSetupWorktree}
						onRemoveWorktree={handleRemoveWorktree}
						onExecuteAction={handleExecuteAction}
						onChangeColor={handleChangeColor}
						onPrune={handleOpenPruneDialog}
						onWizardOpen={handleWizardOpenWithIssue}
						onQuickAddWithWorktree={handleQuickAddWithWorktree}
						onLoadMoreAssignedIssues={handleLoadMoreAssignedIssues}
						onRefreshAssignedIssues={handleRefreshAssignedIssues}
					/>
				{/snippet}
			</WorkspaceDashboardLayout>
		</div>
	{/if}

	<CreationWizard
		assignedIssues={versionControlStore.assignedIssues}
		onCreate={handleWizardCreate}
		onUpdate={handleWizardUpdate}
		onSetupWorktree={handleWizardSetupWorktree}
	/>

	<IssueEditDialog
		issue={editingIssue}
		paletteColors={activePaletteColors}
		{usedColors}
		onClose={() => (editingIssue = null)}
		onUpdate={handleUpdateIssue}
	/>

	<ArchiveConfirmDialog
		issue={archiveTargetIssue}
		unfinishedSessionCount={archiveUnfinishedSessionCount}
		openPrCount={archiveOpenPrCount}
		hasActiveWorktree={archiveTargetIssue?.worktree_state === 'active'}
		onClose={() => (archiveTargetIssue = null)}
		onConfirm={handleArchiveConfirm}
	/>

	<DeleteConfirmDialog
		issue={deleteTargetIssue}
		hasActiveWorktree={deleteTargetIssue?.worktree_state === 'active'}
		onClose={() => (deleteTargetIssue = null)}
		onConfirm={handleDeleteConfirm}
	/>

	<IssueRenameDialog
		issue={renameTargetIssue}
		onClose={() => (renameTargetIssue = null)}
		onRename={handleRename}
	/>

	<PruneWorktreesDialog
		open={pruneDialogOpen}
		{prunableIssues}
		removing={pruneRemoving}
		onClose={() => (pruneDialogOpen = false)}
		onPrune={handlePrune}
	/>

	<ColorChangeDialog
		issue={colorChangeTargetIssue}
		paletteColors={activePaletteColors}
		{usedColors}
		onClose={() => (colorChangeTargetIssue = null)}
		onChangeColor={handleChangeColor}
	/>

	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => versionControlStore.checkAuthStatus()}
	/>
{/if}
