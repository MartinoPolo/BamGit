<script lang="ts">
	import type { NotificationEventType } from '$lib/types/generated';
	import { useNotifications } from '$lib/modules/notifications';
	import { onMount } from 'svelte';

	const notificationStore = useNotifications();

	const EVENT_LABELS: Record<NotificationEventType, string> = {
		'needs-input': 'Needs Input',
		'needs-review': 'Ready for Review',
		finished: 'Finished',
		errored: 'Errored',
		'pr-ready': 'PR Ready',
	};

	const EVENT_DESCRIPTIONS: Record<NotificationEventType, string> = {
		'needs-input': 'Session is waiting for your input (permission or elicitation prompt)',
		'needs-review': 'Session completed a turn and is idle',
		finished: 'Session finished or was stopped',
		errored: 'Session encountered an error',
		'pr-ready': 'Pull request is ready for review',
	};

	onMount(() => {
		notificationStore.loadConfigs();
	});

	async function toggleChannel(
		eventType: NotificationEventType,
		channel: 'sound_enabled' | 'toast_enabled' | 'window_flash_enabled',
		value: boolean,
	) {
		try {
			const updated = await notificationStore.updateNotificationConfig({
				event_type: eventType,
				[channel]: value,
			});
			notificationStore.updateConfig(updated);
		} catch (error) {
			console.error('Failed to update notification config:', error);
		}
	}

	async function handleTestSound(eventType: NotificationEventType) {
		try {
			await notificationStore.testNotificationSound(eventType);
		} catch (error) {
			console.error('Failed to test sound:', error);
		}
	}
</script>

<div class="space-y-4">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Notifications</h2>
		<p class="text-sm text-muted-foreground">
			Configure how you're notified for each event type.
		</p>
	</div>

	{#if notificationStore.loading}
		<p class="text-muted-foreground">Loading notification settings...</p>
	{:else}
		<div class="overflow-hidden rounded-lg border border-border">
			<!-- Header -->
			<div
				class="grid grid-cols-[1fr_80px_80px_80px_60px] gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
			>
				<span>Event</span>
				<span class="text-center">Sound</span>
				<span class="text-center">Toast</span>
				<span class="text-center">Flash</span>
				<span class="text-center">Test</span>
			</div>

			<!-- Rows -->
			{#each notificationStore.configs as config (config.event_type)}
				<div
					class="grid grid-cols-[1fr_80px_80px_80px_60px] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
				>
					<!-- Event label and description -->
					<div>
						<span class="text-sm font-medium text-foreground">
							{EVENT_LABELS[config.event_type] ?? config.event_type}
						</span>
						<p class="text-xs text-muted-foreground">
							{EVENT_DESCRIPTIONS[config.event_type] ?? ''}
						</p>
					</div>

					<!-- Sound toggle -->
					<div class="flex justify-center">
						<button
							class="h-5 w-9 rounded-full transition-colors {config.sound_enabled ===
							true
								? 'bg-primary'
								: 'bg-muted'}"
							onclick={() =>
								toggleChannel(
									config.event_type,
									'sound_enabled',
									config.sound_enabled !== true,
								)}
							title={config.sound_enabled === true ? 'Disable sound' : 'Enable sound'}
						>
							<span
								class="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform {config.sound_enabled ===
								true
									? 'translate-x-4.5'
									: ''}"
							></span>
						</button>
					</div>

					<!-- Toast toggle -->
					<div class="flex justify-center">
						<button
							class="h-5 w-9 rounded-full transition-colors {config.toast_enabled ===
							true
								? 'bg-primary'
								: 'bg-muted'}"
							onclick={() =>
								toggleChannel(
									config.event_type,
									'toast_enabled',
									config.toast_enabled !== true,
								)}
							title={config.toast_enabled === true ? 'Disable toast' : 'Enable toast'}
						>
							<span
								class="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform {config.toast_enabled ===
								true
									? 'translate-x-4.5'
									: ''}"
							></span>
						</button>
					</div>

					<!-- Window flash toggle -->
					<div class="flex justify-center">
						<button
							class="h-5 w-9 rounded-full transition-colors {config.window_flash_enabled ===
							true
								? 'bg-primary'
								: 'bg-muted'}"
							onclick={() =>
								toggleChannel(
									config.event_type,
									'window_flash_enabled',
									config.window_flash_enabled !== true,
								)}
							title={config.window_flash_enabled === true
								? 'Disable window flash'
								: 'Enable window flash'}
						>
							<span
								class="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform {config.window_flash_enabled ===
								true
									? 'translate-x-4.5'
									: ''}"
							></span>
						</button>
					</div>

					<!-- Test sound button -->
					<div class="flex justify-center">
						{#if config.sound_file}
							<button
								class="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								onclick={() => handleTestSound(config.event_type)}
								title="Play test sound"
							>
								&#9654;
							</button>
						{:else}
							<span class="text-xs text-muted-foreground/60">—</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
