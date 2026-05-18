<script lang="ts">
	import type { Issue, IssuePriority } from '$lib/modules/issues';
	import { PRIORITY_OPTIONS } from '$lib/components/blocks/issue/issue_card_utils.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import XIcon from '@lucide/svelte/icons/x';
	import {
		ISSUE_CARD_VARIANTS,
		ISSUE_CARD_SETTING_RANGES,
		VARIANT_SPECIFIC_SETTINGS,
		BUTTON_COLOR_OPTIONS,
		VARIANT_LABELS,
		BUTTON_COLOR_LABELS,
		SLIDER_LABELS,
		useIssueCardSettings,
		type IssueCardVariant,
		type IssueCardSettingKey,
		type RangeKey,
	} from './index.js';

	interface Props {
		selectedCount: number;
		selectedIssues: Issue[];
		onDeselectAll: () => void;
		onBatchArchive: () => void;
		onBatchUnarchive: () => void;
		onBatchDelete: () => void;
		onBatchChangePriority: (priority: IssuePriority | null) => void;
		onBatchPrune: () => void;
	}

	let {
		selectedCount,
		selectedIssues,
		onDeselectAll,
		onBatchArchive,
		onBatchUnarchive,
		onBatchDelete,
		onBatchChangePriority,
		onBatchPrune,
	}: Props = $props();

	const hasActiveIssues = $derived(selectedIssues.some((i) => i.status === 'active'));
	const hasArchivedIssues = $derived(selectedIssues.some((i) => i.status === 'archived'));
	const hasActiveWorktrees = $derived(selectedIssues.some((i) => i.worktree_state === 'active'));
	const hasBatchSelection = $derived(selectedCount > 0);

	const toolbarBackground = $derived.by(() => {
		if (hasBatchSelection) {
			return 'color-mix(in oklch, var(--primary) 10%, var(--surface))';
		}
		return 'transparent';
	});

	const toolbarBorderColor = $derived.by(() => {
		if (hasBatchSelection) {
			return 'color-mix(in oklch, var(--primary) 30%, var(--border))';
		}
		return 'transparent';
	});

	let priorityPopoverOpen = $state(false);
	let settingsPopoverOpen = $state(false);

	const settingsCtx = useIssueCardSettings();

	const activeVariant = $derived(settingsCtx.settings.variant);

	const variantSpecificKeys = $derived(
		VARIANT_SPECIFIC_SETTINGS[activeVariant] as readonly IssueCardSettingKey[],
	);

	function handleSliderChange(key: IssueCardSettingKey, event: Event) {
		const target = event.target as HTMLInputElement;
		void settingsCtx.updateSetting(key, Number(target.value));
	}

	function handlePrioritySelect(priority: IssuePriority | null) {
		priorityPopoverOpen = false;
		onBatchChangePriority(priority);
	}
</script>

<div
	class="flex min-h-10.5 items-center gap-3 rounded-md border px-3.5 py-2 text-[13px] font-medium"
	style="background: {toolbarBackground}; border-color: {toolbarBorderColor};"
>
	{#if hasBatchSelection}
		<!-- Count badge + label -->
		<div class="flex items-center gap-2">
			<span class="rounded bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">
				{selectedCount}
			</span>
			<span class="text-foreground-muted">
				{selectedCount === 1 ? 'issue selected' : 'issues selected'}
			</span>
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Batch action buttons -->
		<div class="flex items-center gap-1.5">
			{#if hasActiveIssues}
				<SimpleTooltip text="Archive selected issues">
					{#snippet asChild(props)}
						<Button
							{...props}
							intent="ghost"
							size="sm"
							onclick={onBatchArchive}
							disabled={!hasActiveIssues}
							aria-label="Archive selected"
						>
							<ArchiveIcon data-icon="inline-start" />
							Archive
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/if}

			{#if hasArchivedIssues}
				<SimpleTooltip text="Unarchive selected issues">
					{#snippet asChild(props)}
						<Button
							{...props}
							intent="ghost"
							size="sm"
							onclick={onBatchUnarchive}
							disabled={!hasArchivedIssues}
							aria-label="Unarchive selected"
						>
							<ArchiveRestoreIcon data-icon="inline-start" />
							Unarchive
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/if}

			<SimpleTooltip text="Delete selected issues">
				{#snippet asChild(props)}
					<Button
						{...props}
						intent="danger"
						size="sm"
						onclick={onBatchDelete}
						aria-label="Delete selected"
					>
						<Trash2Icon data-icon="inline-start" />
						Delete
					</Button>
				{/snippet}
			</SimpleTooltip>

			<Popover.Root bind:open={priorityPopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button {...props} intent="ghost" size="sm" aria-label="Change priority">
							Change Priority
							<ChevronDownIcon data-icon="inline-end" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-40 p-1" align="end">
					{#each PRIORITY_OPTIONS as option (option.value)}
						<Popover.Item
							onclick={() => handlePrioritySelect(option.value)}
							role="menuitem"
						>
							{option.label()}
						</Popover.Item>
					{/each}
				</Popover.Content>
			</Popover.Root>

			{#if hasActiveWorktrees}
				<SimpleTooltip text="Remove active worktrees for selected issues">
					{#snippet asChild(props)}
						<Button
							{...props}
							intent="ghost"
							size="icon-sm"
							onclick={onBatchPrune}
							disabled={!hasActiveWorktrees}
							aria-label="Clean selected worktrees"
						>
							<ScissorsIcon data-icon="inline-start" />
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/if}

			<Button intent="ghost" size="icon-sm" onclick={onDeselectAll} aria-label="Deselect all">
				<XIcon data-icon="inline-start" />
			</Button>
		</div>
	{:else}
		<!-- Default state: settings + prune buttons -->
		<div class="flex flex-1 items-center justify-end gap-1">
			<Popover.Root bind:open={settingsPopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							intent="ghost"
							size="icon-sm"
							aria-label="Issue card settings"
						>
							<SettingsIcon data-icon="inline-start" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-72 p-3" align="end" sideOffset={8}>
					<div class="space-y-3">
						<h4 class="text-sm font-medium">Card Appearance</h4>

						<!-- Variant selector -->
						<div class="space-y-1.5">
							<Label class="text-xs">Variant</Label>
							<div class="flex gap-1">
								{#each Object.keys(ISSUE_CARD_VARIANTS) as variantKey (variantKey)}
									{@const v = variantKey as IssueCardVariant}
									<Button
										intent={activeVariant === v ? 'primary' : 'secondary'}
										size="sm"
										onclick={() => void settingsCtx.updateSetting('variant', v)}
									>
										{VARIANT_LABELS[v]}
									</Button>
								{/each}
							</div>
						</div>

						<!-- Button Color -->
						<div class="space-y-1.5">
							<Label class="text-xs">Action Button Color</Label>
							<div class="flex gap-1">
								{#each BUTTON_COLOR_OPTIONS as option (option)}
									<Button
										intent={settingsCtx.settings.buttonColor === option
											? 'primary'
											: 'secondary'}
										size="sm"
										onclick={() =>
											void settingsCtx.updateSetting('buttonColor', option)}
									>
										{BUTTON_COLOR_LABELS[option] ?? option}
									</Button>
								{/each}
							</div>
						</div>

						<Separator />

						<!-- Shared sliders -->
						{#each ['labelTint', 'overlayGlow'] as key (key)}
							{@const settingKey = key as IssueCardSettingKey}
							{@const range = ISSUE_CARD_SETTING_RANGES[key as RangeKey]}
							{@const value = settingsCtx.settings[settingKey] as number}
							<div class="space-y-0.5">
								<div class="flex items-center justify-between">
									<Label class="text-xs">{SLIDER_LABELS[key]}</Label>
									<span class="text-[10px] tabular-nums text-muted-foreground"
										>{value}%</span
									>
								</div>
								<input
									type="range"
									min={range.min}
									max={range.max}
									step="1"
									{value}
									class="w-full accent-primary"
									oninput={(event) => handleSliderChange(settingKey, event)}
								/>
							</div>
						{/each}

						<!-- Variant-specific sliders -->
						{#if variantSpecificKeys.length > 0}
							<Separator />
							<h4 class="text-xs font-medium text-muted-foreground">
								{VARIANT_LABELS[activeVariant]}
							</h4>
							{#each ['gradientReach', 'colorSaturation', 'headerSaturation', 'radialIntensity'] as key (key)}
								{@const settingKey = key as IssueCardSettingKey}
								{#if variantSpecificKeys.includes(settingKey)}
									{@const range = ISSUE_CARD_SETTING_RANGES[key as RangeKey]}
									{@const value = settingsCtx.settings[settingKey] as number}
									<div class="space-y-0.5">
										<div class="flex items-center justify-between">
											<Label class="text-xs">{SLIDER_LABELS[key]}</Label>
											<span
												class="text-[10px] tabular-nums text-muted-foreground"
												>{value}%</span
											>
										</div>
										<input
											type="range"
											min={range.min}
											max={range.max}
											step="1"
											{value}
											class="w-full accent-primary"
											oninput={(event) =>
												handleSliderChange(settingKey, event)}
										/>
									</div>
								{/if}
							{/each}
						{/if}
					</div>
				</Popover.Content>
			</Popover.Root>

			<SimpleTooltip text="Remove inactive and orphaned worktrees">
				{#snippet asChild(props)}
					<Button
						{...props}
						intent="ghost"
						size="icon-sm"
						onclick={onBatchPrune}
						aria-label="Clean up worktrees"
					>
						<ScissorsIcon data-icon="inline-start" />
					</Button>
				{/snippet}
			</SimpleTooltip>
		</div>
	{/if}
</div>
