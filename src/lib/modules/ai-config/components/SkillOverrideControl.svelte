<script lang="ts">
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import { cn } from '$lib/utils.js';

	// ─── Types ───────────────────────────────────────────────────────────────

	type OverrideValue = 'on' | 'name-only' | 'user-invocable-only' | 'off';

	interface Props {
		skillName: string;
		currentValue: string | null;
		workspaceRoot?: string;
		variant?: 'chip' | 'full';
	}

	// ─── Constants ───────────────────────────────────────────────────────────

	const OVERRIDE_OPTIONS: { value: OverrideValue; label: string }[] = [
		{ value: 'on', label: 'On (default)' },
		{ value: 'name-only', label: 'Name only' },
		{ value: 'user-invocable-only', label: 'User-invocable only' },
		{ value: 'off', label: 'Off' },
	];

	// ─── Props ───────────────────────────────────────────────────────────────

	let { skillName, currentValue, workspaceRoot, variant = 'chip' }: Props = $props();

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── Derived ─────────────────────────────────────────────────────────────

	const effectiveValue = $derived<OverrideValue>((currentValue as OverrideValue) ?? 'on');
	const isDisabled = $derived(workspaceRoot === undefined || workspaceRoot === '');
	const currentLabel = $derived(
		OVERRIDE_OPTIONS.find((o) => o.value === effectiveValue)?.label ?? 'On (default)',
	);
	const isNonDefault = $derived(effectiveValue !== 'on');

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleSelect(value: OverrideValue): Promise<void> {
		if (isDisabled || workspaceRoot === undefined) {
			return;
		}
		await aiConfig.setSkillOverride(workspaceRoot, skillName, value);
	}
</script>

{#if variant === 'chip'}
	{#if isDisabled}
		<WithTooltip text="Open a workspace to override skills">
			<Badge variant="default" size="compact" class="cursor-not-allowed opacity-50">
				{isNonDefault ? currentLabel : 'Override'}
			</Badge>
		</WithTooltip>
	{:else if isNonDefault}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Badge
						{...props}
						variant="warning"
						size="compact"
						class="cursor-pointer gap-0.5"
					>
						{currentLabel}
						<ChevronDownIcon class="size-2.5" />
					</Badge>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				{#each OVERRIDE_OPTIONS as option (option.value)}
					<DropdownMenu.Item
						onSelect={() => handleSelect(option.value)}
						class={cn(effectiveValue === option.value && 'font-medium')}
					>
						{option.label}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
{:else}
	<div class="flex flex-col gap-1">
		<span class="text-xs font-medium text-foreground-muted">Skill override</span>
		{#if isDisabled}
			<WithTooltip text="Open a workspace to override skills">
				<div>
					<select
						disabled
						class="w-full cursor-not-allowed rounded-md border border-border bg-surface px-2 py-1.5 text-sm opacity-50"
					>
						<option>{currentLabel}</option>
					</select>
				</div>
			</WithTooltip>
		{:else}
			<select
				value={effectiveValue}
				onchange={(e) => handleSelect(e.currentTarget.value as OverrideValue)}
				class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{#each OVERRIDE_OPTIONS as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		{/if}
	</div>
{/if}
