<script lang="ts">
	import { useBoard } from '$lib/modules/board';

	const boardStore = useBoard();
	const dashboard = $derived(boardStore.activeDashboard);
</script>

<div class="space-y-8">
	{#if dashboard}
		<section class="space-y-4">
			<div>
				<h2 class="text-lg font-medium">{dashboard.name}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Workspace-specific settings. Use the scope switcher in the sidebar to configure
					per-workspace overrides for appearance, issue cards, and notifications.
				</p>
			</div>

			<div class="space-y-3 rounded border border-border bg-muted/50 p-4 text-sm">
				{#if dashboard.github_repo}
					<div class="flex items-baseline gap-2">
						<span class="font-medium text-muted-foreground">Repository</span>
						<span>{dashboard.github_repo}</span>
					</div>
				{/if}
				{#if dashboard.local_folder}
					<div class="flex items-baseline gap-2">
						<span class="font-medium text-muted-foreground">Local folder</span>
						<span class="font-mono text-xs">{dashboard.local_folder}</span>
					</div>
				{/if}
				{#if dashboard.default_base_branch}
					<div class="flex items-baseline gap-2">
						<span class="font-medium text-muted-foreground">Base branch</span>
						<span class="font-mono text-xs">{dashboard.default_base_branch}</span>
					</div>
				{/if}
				{#if dashboard.worktree_parent_folder}
					<div class="flex items-baseline gap-2">
						<span class="font-medium text-muted-foreground">Worktree folder</span>
						<span class="font-mono text-xs">{dashboard.worktree_parent_folder}</span>
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<div class="space-y-4">
			<h2 class="text-lg font-medium">Workspace</h2>
			<p class="text-sm text-muted-foreground">
				No workspace selected. Workspace settings are available when a workspace is active.
			</p>
		</div>
	{/if}
</div>
