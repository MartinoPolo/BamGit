<script lang="ts">
	import type { Session, SessionState } from '$lib/types/session';
	import { NOTIFICATION_DOT_COLORS } from '$lib/types/notification';
	import { get_notification_store } from '$lib/stores/notifications.svelte';

	interface Props {
		session: Session;
		on_click: (session: Session) => void;
		on_terminate: (id: string) => void;
	}

	let { session, on_click, on_terminate }: Props = $props();

	const notification_store = get_notification_store();

	const notification_dot_color = $derived.by(() => {
		const pending_type = notification_store.get_pending_type(session.id);
		if (pending_type === undefined) {
			return null;
		}
		return NOTIFICATION_DOT_COLORS[pending_type];
	});

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
<div
	class="w-full cursor-pointer rounded-lg border border-border bg-card p-3 text-left transition hover:border-input hover:bg-accent"
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
			<div class="flex items-center gap-2">
				{#if notification_dot_color}
					<span
						class="h-2 w-2 shrink-0 animate-pulse rounded-full {notification_dot_color}"
						title="Pending notification"
					></span>
				{/if}
				<p class="truncate text-sm font-medium text-foreground">
					{session.original_intent ?? 'Session'}
				</p>
			</div>
			{#if session.last_response_summary}
				<p class="mt-1 truncate text-xs text-muted-foreground">
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

	<div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
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
				class="ml-auto text-destructive hover:text-destructive/80"
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
