<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { DiscoveredSession, DiscoveredSessionStatus } from '$lib/types/generated';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		session: DiscoveredSession;
		onAdopt: (session: DiscoveredSession) => void;
	}

	let { session, onAdopt }: Props = $props();

	const STATUS_LABELS: Record<DiscoveredSessionStatus, () => string> = {
		working: () => m.discovered_status_working(),
		needs_attention: () => m.discovered_status_needs_attention(),
		idle: () => m.discovered_status_idle(),
		finished: () => m.discovered_status_finished(),
		unknown: () => m.discovered_status_unknown(),
	};

	const statusConfig: Record<DiscoveredSessionStatus, { color: string }> = {
		working: { color: 'bg-session-running' },
		needs_attention: { color: 'bg-session-needs-input' },
		idle: { color: 'bg-session-idle' },
		finished: { color: 'bg-session-finished' },
		unknown: { color: 'bg-session-paused' },
	};

	const badge = $derived(statusConfig[session.status] ?? statusConfig.unknown);
	const badgeLabel = $derived(STATUS_LABELS[session.status]?.() ?? m.discovered_status_unknown());

	const formattedCost = $derived(session.cost_usd > 0 ? `$${session.cost_usd.toFixed(3)}` : '');
</script>

<div class="w-full rounded-lg border border-dashed border-input bg-muted/50 p-3 text-left">
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<p class="truncate text-sm font-medium text-foreground">
					{session.project_name}
				</p>
				{#if session.git_branch}
					<span class="shrink-0 text-xs text-muted-foreground">
						{session.git_branch}
					</span>
				{/if}
			</div>
			{#if session.first_prompt}
				<p class="mt-1 truncate text-xs text-muted-foreground">
					{session.first_prompt}
				</p>
			{/if}
		</div>

		<div class="flex shrink-0 items-center gap-2">
			<span
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white {badge.color}"
			>
				{#if session.status === 'working'}
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
				{/if}
				{badgeLabel}
			</span>
		</div>
	</div>

	<div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
		<span>{m.discovered_pid({ pid: session.pid })}</span>
		<span>{m.discovered_messages({ count: session.message_count })}</span>
		{#if formattedCost}
			<span>{formattedCost}</span>
		{/if}
		{#if session.token_count > 0}
			<span>{session.token_count.toLocaleString()} tokens</span>
		{/if}

		<Button
			variant="primary"
			size="sm"
			class="ml-auto"
			onclick={(event: MouseEvent) => {
				event.stopPropagation();
				onAdopt(session);
			}}
		>
			{m.discovered_adopt()}
		</Button>
	</div>
</div>
