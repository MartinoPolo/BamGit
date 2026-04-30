<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import type { OverviewWorkspaceData, ColorPalette } from '$lib/types/generated';

	interface Props {
		workspace: OverviewWorkspaceData;
		palette: ColorPalette | null;
		onclick: () => void;
		onGithubClick?: () => void;
		onFolderClick?: () => void;
	}

	let { workspace, palette, onclick, onGithubClick, onFolderClick }: Props = $props();

	const accentColor = $derived(palette?.colors[0] ?? '#6b7280');

	function formatRelativeTime(isoString: string | null): string {
		if (isoString == null) {
			return m.workspace_no_activity();
		}
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);

		if (diffMinutes < 1) {
			return m.time_just_now();
		}
		if (diffMinutes < 60) {
			return m.time_minutes_ago({ count: String(diffMinutes) });
		}
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) {
			return m.time_hours_ago({ count: String(diffHours) });
		}
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) {
			return m.workspace_yesterday();
		}
		return m.time_days_ago({ count: String(diffDays) });
	}

	function formatCost(cost: number | null): string {
		if (cost == null || cost === 0) {
			return '$0.00';
		}
		return `$${cost.toFixed(2)}`;
	}
</script>

<button class="block w-full text-left" {onclick}>
	<Card.Card
		padding="none"
		class="group relative cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
	>
		<div
			class="absolute inset-0 rounded-[var(--radius-lg)] opacity-[0.08]"
			style:background="linear-gradient(135deg, {accentColor} 0%, transparent 60%)"
		></div>

		<div class="relative p-4">
			<!-- Header: name + quick access -->
			<div class="mb-3 flex items-start justify-between">
				<div class="flex items-center gap-2">
					<div class="size-3 rounded-full" style:background-color={accentColor}></div>
					<h3 class="text-sm font-semibold text-foreground">{workspace.name}</h3>
				</div>
				<div class="flex gap-1">
					{#if workspace.github_repo}
						<Button
							variant="ghost"
							size="icon"
							class="size-7"
							onclick={(event: MouseEvent) => {
								event.stopPropagation();
								onGithubClick?.();
							}}
						>
							<ExternalLinkIcon class="size-3.5" />
						</Button>
					{/if}
					{#if workspace.local_folder}
						<Button
							variant="ghost"
							size="icon"
							class="size-7"
							onclick={(event: MouseEvent) => {
								event.stopPropagation();
								onFolderClick?.();
							}}
						>
							<FolderOpenIcon class="size-3.5" />
						</Button>
					{/if}
				</div>
			</div>

			<!-- Health indicators -->
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<div class="flex items-center gap-1 text-xs text-muted-foreground">
					<CircleAlertIcon class="size-3.5" />
					<span>{workspace.open_issue_count}</span>
				</div>
				{#if workspace.active_session_count > 0}
					<Badge variant="default" class="text-[10px]">
						<ActivityIcon class="mr-0.5 size-3" />
						{m.active_count({
							count: String(workspace.active_session_count),
						})}
					</Badge>
				{/if}
			</div>

			<!-- Footer: last activity + cost -->
			<div class="flex items-center justify-between text-[11px] text-muted-foreground">
				<span>{formatRelativeTime(workspace.last_activity ?? null)}</span>
				<span class="font-mono">{formatCost(workspace.total_cost_usd ?? null)}</span>
			</div>
		</div>
	</Card.Card>
</button>
