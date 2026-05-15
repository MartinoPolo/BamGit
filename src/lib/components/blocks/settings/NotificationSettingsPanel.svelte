<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { NotificationEventType } from '$lib/types/generated';
	import { useNotifications, groupConfigsByTier } from '$lib/modules/notifications';
	import { useToasts } from '$lib/modules/toasts/index.js';
	import { onMount } from 'svelte';
	import { Switch } from '$lib/components/shadcn/switch/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import VolumeIcon from '@lucide/svelte/icons/volume-2';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	const notificationStore = useNotifications();
	const toasts = useToasts();

	const EVENT_LABELS: Record<NotificationEventType, () => string> = {
		'session.start': () => m.notification_event_session_start(),
		'session.end': () => m.notification_event_session_end(),
		'session.error': () => m.notification_event_session_error(),
		'session.needs-input': () => m.notification_event_session_needs_input(),
		'task.complete': () => m.notification_event_task_complete(),
		'task.acknowledge': () => m.notification_event_task_acknowledge(),
		'pr.ready': () => m.notification_event_pr_ready(),
		'pr.merged': () => m.notification_event_pr_merged(),
		'pr.review-requested': () => m.notification_event_pr_review_requested(),
		'merge.conflict': () => m.notification_event_merge_conflict(),
		'branch.behind-base': () => m.notification_event_branch_behind_base(),
		'github.issue-assigned': () => m.notification_event_github_issue_assigned(),
		'github.trigger-received': () => m.notification_event_github_trigger_received(),
		'achievement.unlocked': () => m.notification_event_achievement_unlocked(),
		'resource.limit': () => m.notification_event_resource_limit(),
	};

	const EVENT_DESCRIPTIONS: Record<NotificationEventType, () => string> = {
		'session.start': () => m.notification_desc_session_start(),
		'session.end': () => m.notification_desc_session_end(),
		'session.error': () => m.notification_desc_session_error(),
		'session.needs-input': () => m.notification_desc_session_needs_input(),
		'task.complete': () => m.notification_desc_task_complete(),
		'task.acknowledge': () => m.notification_desc_task_acknowledge(),
		'pr.ready': () => m.notification_desc_pr_ready(),
		'pr.merged': () => m.notification_desc_pr_merged(),
		'pr.review-requested': () => m.notification_desc_pr_review_requested(),
		'merge.conflict': () => m.notification_desc_merge_conflict(),
		'branch.behind-base': () => m.notification_desc_branch_behind_base(),
		'github.issue-assigned': () => m.notification_desc_github_issue_assigned(),
		'github.trigger-received': () => m.notification_desc_github_trigger_received(),
		'achievement.unlocked': () => m.notification_desc_achievement_unlocked(),
		'resource.limit': () => m.notification_desc_resource_limit(),
	};

	const TIER_STYLES: Record<string, string> = {
		critical: 'text-red-400',
		important: 'text-amber-400',
		normal: 'text-muted-foreground',
	};

	const configsByTier = $derived(groupConfigsByTier(notificationStore.configs));

	onMount(() => {
		notificationStore.loadConfigs();
		notificationStore.loadGlobalVolume();
		notificationStore.loadSoundPacks();
		notificationStore.loadVolumeOverrides();
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
			toasts.show({
				tone: 'danger',
				title: 'Sound playback failed',
				body: String(error),
			});
		}
	}

	function handleVolumeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const volume = parseFloat(target.value);
		notificationStore.setGlobalVolume(volume);
	}

	async function handleRemovePack(packName: string) {
		try {
			await notificationStore.removeSoundPack(packName);
		} catch (error) {
			console.error('Failed to remove sound pack:', error);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header + Global Volume -->
	<div>
		<h2 class="text-lg font-semibold text-foreground">{m.notification_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.notification_description()}
		</p>
	</div>

	<!-- Global volume control -->
	<div class="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
		<VolumeIcon class="size-4 shrink-0 text-muted-foreground" />
		<span class="text-sm font-medium text-foreground">Global Volume</span>
		<input
			type="range"
			min="0"
			max="1"
			step="0.05"
			value={notificationStore.globalVolume}
			oninput={handleVolumeChange}
			class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
		/>
		<span class="w-10 text-right text-xs text-muted-foreground">
			{Math.round(notificationStore.globalVolume * 100)}%
		</span>
	</div>

	{#if notificationStore.loading}
		<p class="text-muted-foreground">{m.loading_notification_settings()}</p>
	{:else}
		<!-- Event config tiers -->
		{#each configsByTier as group (group.tier)}
			<div class="overflow-hidden rounded-lg border border-border">
				<!-- Tier header -->
				<div class="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
					<span
						class="text-xs font-semibold uppercase tracking-wider {TIER_STYLES[
							group.tier
						]}"
					>
						{group.label}
					</span>
					<span class="text-xs text-muted-foreground">
						({group.configs.length})
					</span>
				</div>

				<!-- Column headers -->
				<div
					class="grid grid-cols-[1fr_80px_80px_80px_60px] gap-2 border-b border-border bg-muted/30 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"
				>
					<span>{m.notification_header_event()}</span>
					<span class="text-center">{m.notification_header_sound()}</span>
					<span class="text-center">{m.notification_header_toast()}</span>
					<span class="text-center">{m.notification_header_flash()}</span>
					<span class="text-center">{m.notification_header_test()}</span>
				</div>

				<!-- Rows -->
				{#each group.configs as config (config.event_type)}
					<div
						class="grid grid-cols-[1fr_80px_80px_80px_60px] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
						class:opacity-50={config.importance_tier === 'normal' &&
							!config.sound_enabled &&
							!config.toast_enabled &&
							!config.window_flash_enabled}
					>
						<div>
							<span class="text-sm font-medium text-foreground">
								{EVENT_LABELS[config.event_type]?.() ?? config.event_type}
							</span>
							<p class="text-xs text-muted-foreground">
								{EVENT_DESCRIPTIONS[config.event_type]?.() ?? ''}
							</p>
						</div>

						<div class="flex justify-center">
							<SimpleTooltip
								text={config.sound_enabled === true
									? 'Disable sound'
									: 'Enable sound'}
							>
								<Switch
									checked={config.sound_enabled === true}
									onCheckedChange={(checked) =>
										toggleChannel(config.event_type, 'sound_enabled', checked)}
								/>
							</SimpleTooltip>
						</div>

						<div class="flex justify-center">
							<SimpleTooltip
								text={config.toast_enabled === true
									? 'Disable toast'
									: 'Enable toast'}
							>
								<Switch
									checked={config.toast_enabled === true}
									onCheckedChange={(checked) =>
										toggleChannel(config.event_type, 'toast_enabled', checked)}
								/>
							</SimpleTooltip>
						</div>

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

						<div class="flex justify-center">
							{#if config.sound_file}
								<SimpleTooltip text="Play test sound">
									<Button
										intent="ghost"
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
		{/each}
	{/if}

	<Separator />

	<!-- Sound Packs section -->
	<div>
		<div class="flex items-center gap-2">
			<PackageIcon class="size-4 text-muted-foreground" />
			<h3 class="text-sm font-semibold text-foreground">Sound Packs</h3>
		</div>
		<p class="mt-1 text-xs text-muted-foreground">
			Installed sound packs. Place packs in the sound-packs directory or install via file
			picker.
		</p>
	</div>

	{#if notificationStore.soundPacks.length === 0}
		<p class="text-sm text-muted-foreground">No sound packs installed.</p>
	{:else}
		<div class="space-y-2">
			{#each notificationStore.soundPacks as pack (pack.name)}
				<div
					class="flex items-center justify-between rounded-lg border border-border px-4 py-3"
				>
					<div class="flex items-center gap-3">
						<PackageIcon class="size-5 text-muted-foreground" />
						<div>
							<span class="text-sm font-medium text-foreground">
								{pack.display_name}
							</span>
							<div class="flex items-center gap-2">
								<span class="text-xs text-muted-foreground">
									v{pack.version}
								</span>
								{#if pack.author}
									<span class="text-xs text-muted-foreground">
										by {pack.author}
									</span>
								{/if}
								<Badge format="mono">
									{pack.event_count} sounds
								</Badge>
							</div>
						</div>
					</div>
					{#if pack.name !== 'grove'}
						<SimpleTooltip text="Remove pack">
							<Button
								intent="ghost"
								size="icon-sm"
								onclick={() => handleRemovePack(pack.name)}
							>
								<TrashIcon data-icon="inline-end" />
							</Button>
						</SimpleTooltip>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
