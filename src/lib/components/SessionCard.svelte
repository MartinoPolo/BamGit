<script lang="ts">
	import type { Session, SessionState } from '$lib/types/session';

	interface Props {
		session: Session;
		on_click: (session: Session) => void;
		on_terminate: (id: string) => void;
	}

	let { session, on_click, on_terminate }: Props = $props();

	const state_config: Record<SessionState, { label: string; color: string }> = {
		running: { label: 'Running', color: 'bg-green-500' },
		'needs-input': { label: 'Needs Input', color: 'bg-amber-500' },
		'needs-review': { label: 'Needs Review', color: 'bg-blue-500' },
		paused: { label: 'Paused', color: 'bg-neutral-400' },
		finished: { label: 'Finished', color: 'bg-neutral-600' },
		errored: { label: 'Errored', color: 'bg-red-500' },
	};

	const badge = $derived(state_config[session.state] ?? state_config.running);
	const is_active = $derived(session.state !== 'finished' && session.state !== 'errored');

	const formatted_cost = $derived(
		session.cost_usd != null ? `$${session.cost_usd.toFixed(3)}` : '',
	);

	const relative_time = $derived.by(() => {
		const started = new Date(session.started_at + 'Z');
		const now = new Date();
		const diff_seconds = Math.floor((now.getTime() - started.getTime()) / 1000);

		if (diff_seconds < 60) {
			return `${diff_seconds}s ago`;
		}
		if (diff_seconds < 3600) {
			return `${Math.floor(diff_seconds / 60)}m ago`;
		}
		if (diff_seconds < 86400) {
			return `${Math.floor(diff_seconds / 3600)}h ago`;
		}
		return `${Math.floor(diff_seconds / 86400)}d ago`;
	});
</script>

<!-- Using div instead of button to allow nested Stop button -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-left transition hover:border-neutral-600 hover:bg-neutral-750"
	role="button"
	tabindex="0"
	onclick={() => on_click(session)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			on_click(session);
		}
	}}
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-neutral-200">
				{session.original_intent ?? 'Session'}
			</p>
			{#if session.last_response_summary}
				<p class="mt-1 truncate text-xs text-neutral-400">
					{session.last_response_summary}
				</p>
			{/if}
		</div>

		<div class="flex shrink-0 items-center gap-2">
			<span
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white {badge.color}"
			>
				{#if session.state === 'running'}
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
				{/if}
				{badge.label}
			</span>
		</div>
	</div>

	<div class="mt-2 flex items-center gap-3 text-xs text-neutral-500">
		<span>{session.provider}</span>
		<span>{relative_time}</span>
		{#if formatted_cost}
			<span>{formatted_cost}</span>
		{/if}
		{#if session.token_count}
			<span>{session.token_count.toLocaleString()} tokens</span>
		{/if}

		{#if is_active}
			<button
				class="ml-auto text-red-400 hover:text-red-300"
				onclick={(e) => {
					e.stopPropagation();
					on_terminate(session.id);
				}}
			>
				Stop
			</button>
		{/if}
	</div>
</div>
