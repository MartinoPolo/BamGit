<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { NotificationEventType } from '$lib/types/generated';
	import { useNotifications } from '$lib/modules/notifications';
	import { onMount } from 'svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';

	const notificationStore = useNotifications();

	const EVENT_LABELS: Record<NotificationEventType, () => string> = {
		'needs-input': () => m.notification_event_needs_input(),
		'needs-review': () => m.notification_event_needs_review(),
		finished: () => m.notification_event_finished(),
		errored: () => m.notification_event_errored(),
		'pr-ready': () => m.notification_event_pr_ready(),
	};

	const EVENT_DESCRIPTIONS: Record<NotificationEventType, () => string> = {
		'needs-input': () => m.notification_desc_needs_input(),
		'needs-review': () => m.notification_desc_needs_review(),
		finished: () => m.notification_desc_finished(),
		errored: () => m.notification_desc_errored(),
		'pr-ready': () => m.notification_desc_pr_ready(),
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
		<h2 class="text-lg font-semibold text-foreground">{m.notification_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.notification_description()}
		</p>
	</div>

	{#if notificationStore.loading}
		<p class="text-muted-foreground">{m.loading_notification_settings()}</p>
	{:else}
		<div class="overflow-hidden rounded-lg border border-border">
			<!-- Header -->
			<div
				class="grid grid-cols-[1fr_80px_80px_80px_60px] gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
			>
				<span>{m.notification_header_event()}</span>
				<span class="text-center">{m.notification_header_sound()}</span>
				<span class="text-center">{m.notification_header_toast()}</span>
				<span class="text-center">{m.notification_header_flash()}</span>
				<span class="text-center">{m.notification_header_test()}</span>
			</div>

			<!-- Rows -->
			{#each notificationStore.configs as config (config.event_type)}
				<div
					class="grid grid-cols-[1fr_80px_80px_80px_60px] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
				>
					<!-- Event label and description -->
					<div>
						<span class="text-sm font-medium text-foreground">
							{EVENT_LABELS[config.event_type]?.() ?? config.event_type}
						</span>
						<p class="text-xs text-muted-foreground">
							{EVENT_DESCRIPTIONS[config.event_type]?.() ?? ''}
						</p>
					</div>

					<!-- Sound toggle -->
					<div class="flex justify-center">
						<SimpleTooltip
							text={config.sound_enabled === true ? 'Disable sound' : 'Enable sound'}
						>
							<Switch
								checked={config.sound_enabled === true}
								onCheckedChange={(checked) =>
									toggleChannel(config.event_type, 'sound_enabled', checked)}
							/>
						</SimpleTooltip>
					</div>

					<!-- Toast toggle -->
					<div class="flex justify-center">
						<SimpleTooltip
							text={config.toast_enabled === true ? 'Disable toast' : 'Enable toast'}
						>
							<Switch
								checked={config.toast_enabled === true}
								onCheckedChange={(checked) =>
									toggleChannel(config.event_type, 'toast_enabled', checked)}
							/>
						</SimpleTooltip>
					</div>

					<!-- Window flash toggle -->
					<div class="flex justify-center">
						<SimpleTooltip
							text={config.window_flash_enabled === true
								? 'Disable window flash'
								: 'Enable window flash'}
						>
							<Switch
								checked={config.window_flash_enabled === true}
								onCheckedChange={(checked) =>
									toggleChannel(
										config.event_type,
										'window_flash_enabled',
										checked,
									)}
							/>
						</SimpleTooltip>
					</div>

					<!-- Test sound button -->
					<div class="flex justify-center">
						{#if config.sound_file}
							<SimpleTooltip text="Play test sound">
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={() => handleTestSound(config.event_type)}
								>
									&#9654;
								</Button>
							</SimpleTooltip>
						{:else}
							<span class="text-xs text-muted-foreground/60">—</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
