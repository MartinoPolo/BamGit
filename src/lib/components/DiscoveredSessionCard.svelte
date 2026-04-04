<script lang="ts">
	import type { DiscoveredSession, DiscoveredSessionStatus } from '$lib/types/session';

	interface Props {
		session: DiscoveredSession;
		on_adopt: (session: DiscoveredSession) => void;
	}

	let { session, on_adopt }: Props = $props();

	const status_config: Record<DiscoveredSessionStatus, { label: string; color: string }> = {
		working: { label: 'Working', color: 'bg-green-500' },
		needs_attention: { label: 'Needs Attention', color: 'bg-amber-500' },
		idle: { label: 'Idle', color: 'bg-blue-500' },
		finished: { label: 'Finished', color: 'bg-neutral-600' },
		unknown: { label: 'Unknown', color: 'bg-neutral-500' },
	};

	const badge = $derived(status_config[session.status] ?? status_config.unknown);

	const formatted_cost = $derived(session.cost_usd > 0 ? `$${session.cost_usd.toFixed(3)}` : '');
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
				{badge.label}
			</span>
		</div>
	</div>

	<div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
		<span>PID {session.pid}</span>
		<span>{session.message_count} msgs</span>
		{#if formatted_cost}
			<span>{formatted_cost}</span>
		{/if}
		{#if session.token_count > 0}
			<span>{session.token_count.toLocaleString()} tokens</span>
		{/if}

		<button
			class="ml-auto rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
			onclick={(e) => {
				e.stopPropagation();
				on_adopt(session);
			}}
		>
			Adopt
		</button>
	</div>
</div>
