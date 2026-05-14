<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Session, SessionState } from '$lib/types/generated';
	import { NOTIFICATION_DOT_COLORS, useNotifications } from '$lib/modules/notifications';
	import { Button } from '$lib/components/shadcn/button/index.js';

	interface Props {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	}

	let { session, onClick, onTerminate }: Props = $props();

	const notificationStore = useNotifications();

	const notificationDotColor = $derived.by(() => {
		const pendingType = notificationStore.getPendingType(session.id);
		if (pendingType === undefined) {
			return null;
		}
		return NOTIFICATION_DOT_COLORS[pendingType];
	});

	const STATE_LABELS: Record<SessionState, () => string> = {
		running: () => m.session_state_running(),
		'needs-input': () => m.session_state_needs_input(),
		'needs-review': () => m.session_state_needs_review(),
		paused: () => m.session_state_paused(),
		finished: () => m.session_state_finished(),
		errored: () => m.session_state_errored(),
	};

	const stateConfig: Record<SessionState, { color: string }> = {
		running: { color: 'bg-session-running' },
		'needs-input': { color: 'bg-session-needs-input' },
		'needs-review': { color: 'bg-session-needs-review' },
		paused: { color: 'bg-session-paused' },
		finished: { color: 'bg-session-finished' },
		errored: { color: 'bg-session-errored' },
	};

	const badge = $derived(stateConfig[session.state] ?? stateConfig.running);
	const badgeLabel = $derived(STATE_LABELS[session.state]?.() ?? m.session_state_running());
	const isActive = $derived(session.state !== 'finished' && session.state !== 'errored');

	const formattedCost = $derived(
		session.cost_usd != null ? `$${session.cost_usd.toFixed(3)}` : '',
	);

	const relativeTime = $derived.by(() => {
		const started = new Date(session.started_at + 'Z');
		const now = new Date();
		const diffSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);

		if (diffSeconds < 60) {
			return m.time_seconds_ago({ count: diffSeconds });
		}
		if (diffSeconds < 3600) {
			return m.time_minutes_ago({ count: Math.floor(diffSeconds / 60) });
		}
		if (diffSeconds < 86400) {
			return m.time_hours_ago({ count: Math.floor(diffSeconds / 3600) });
		}
		return m.time_days_ago({ count: Math.floor(diffSeconds / 86400) });
	});
</script>

<!-- Using div instead of button to allow nested Stop button -->
<div
	class="w-full cursor-pointer rounded-lg border border-border bg-card p-3 text-left transition hover:border-input hover:bg-accent"
	role="button"
	tabindex="0"
	onclick={() => onClick(session)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick(session);
		}
	}}
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				{#if notificationDotColor}
					<span
						class="h-2 w-2 shrink-0 animate-pulse rounded-full {notificationDotColor}"
						title={m.issue_card_pending_notification()}
					></span>
				{/if}
				<p class="truncate text-sm font-medium text-foreground">
					{session.original_intent ?? m.session_fallback_title()}
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
				{badgeLabel}
			</span>
		</div>
	</div>

	<div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
		<span>{session.provider}</span>
		<span>{relativeTime}</span>
		{#if formattedCost}
			<span>{formattedCost}</span>
		{/if}
		{#if session.token_count}
			<span>{session.token_count.toLocaleString()} tokens</span>
		{/if}

		{#if isActive}
			<Button
				intent="danger"
				size="sm"
				class="ml-auto"
				onclick={(event: MouseEvent) => {
					event.stopPropagation();
					onTerminate(session.id);
				}}
			>
				{m.session_stop()}
			</Button>
		{/if}
	</div>
</div>
