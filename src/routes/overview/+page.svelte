<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { openPath } from '$lib/opener.js';
	import { invoke } from '$lib/tauri.js';
	import { useBoard } from '$lib/modules/board';
	import { useSettings } from '$lib/modules/settings';
	import { useVersionControl } from '$lib/modules/version-control';
	import { getOverviewData, openWorkspaceWindow } from '$lib/modules/window';
	import WorkspaceCard from '$lib/components/blocks/workspace-card/WorkspaceCard.svelte';
	import AddWorkspaceCard from '$lib/components/blocks/workspace/AddWorkspaceCard.svelte';
	import GitHubStatusCard from '$lib/components/blocks/github/GitHubStatusCard.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import ThemeToggle from '$lib/components/derived/theme-toggle/ThemeToggle.svelte';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Toggle } from '$lib/components/shadcn/toggle/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const boardStore = useBoard();
	const settingsCtx = useSettings();
	const versionControl = useVersionControl();

	let authWizardOpen = $state(false);

	let workspaces = $state.raw<OverviewWorkspaceData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showArchived = $state(false);

	$effect(() => {
		void boardStore.dashboards; // re-run when workspace list changes
		const includeArchived = showArchived;
		void (async () => {
			loading = true;
			try {
				workspaces = await getOverviewData(includeArchived);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		})();
	});

	async function handleOpenWorkspace(dashboardId: string) {
		try {
			await openWorkspaceWindow(dashboardId);
		} catch (err) {
			console.error('Failed to open workspace window:', err);
		}
	}

	function handleGithubClick(githubRepo: string) {
		window.open(`https://github.com/${githubRepo}`, '_blank');
	}

	function handleFolderClick(localFolder: string) {
		void openPath(localFolder);
	}

	function handleConfigWizard(_dashboardId: string) {
		// TODO: open config wizard for workspace
		console.info('Config wizard for', _dashboardId);
	}
</script>

<div class="flex flex-col gap-6 p-8">
	<div class="flex items-end justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{m.app_name()}</h1>
			<p class="text-sm text-muted-foreground">{m.overview_subtitle()}</p>
		</div>
		<div class="flex items-center gap-2">
			<ThemeToggle compact />
			<SimpleTooltip text={m.nav_settings()} side="bottom">
				{#snippet asChild(props)}
					<button
						{...props}
						type="button"
						class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
						aria-label={m.nav_settings()}
						onclick={() => {
							settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
							void goto(resolve('/settings/general'));
						}}
					>
						<SettingsIcon size={14} />
					</button>
				{/snippet}
			</SimpleTooltip>
			<Toggle
				intent="outline"
				size="icon"
				pressed={showArchived}
				onPressedChange={(pressed) => (showArchived = pressed)}
				aria-label="Toggle archived workspaces"
			>
				<ArchiveIcon data-icon="inline-start" />
			</Toggle>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							intent="secondary"
							size="icon"
							aria-label="GitHub connection settings"
						>
							<GithubIcon data-icon="inline-start" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-80" align="end">
					<GitHubStatusCard
						borderless
						authStatus={versionControl.authStatus}
						ghAvailability={versionControl.ghAvailability}
						onconnect={() => (authWizardOpen = true)}
						ondisconnect={async () => {
							await invoke('github_logout');
							await versionControl.checkAvailability();
						}}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>

	{#if loading}
		<p class="text-muted-foreground">{m.overview_loading()}</p>
	{:else if error !== null}
		<p class="text-destructive">{m.error_prefix({ message: error })}</p>
	{:else}
		<div class="grid auto-rows-[1fr] grid-cols-[repeat(auto-fill,340px)] gap-4">
			{#each workspaces as workspace (workspace.dashboard_id)}
				<WorkspaceCard
					{workspace}
					onclick={() => handleOpenWorkspace(workspace.dashboard_id)}
					onGithubClick={workspace.github_repo != null
						? () => handleGithubClick(workspace.github_repo!)
						: () => handleConfigWizard(workspace.dashboard_id)}
					onFolderClick={workspace.local_folder != null
						? () => handleFolderClick(workspace.local_folder!)
						: () => handleConfigWizard(workspace.dashboard_id)}
					onGithubRightClick={() => handleConfigWizard(workspace.dashboard_id)}
					onFolderRightClick={() => handleConfigWizard(workspace.dashboard_id)}
				/>
			{/each}
			<AddWorkspaceCard onclick={() => (boardStore.showCreateDialog = true)} />
		</div>
	{/if}
</div>

{#if authWizardOpen}
	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => void versionControl.checkAvailability()}
	/>
{/if}
