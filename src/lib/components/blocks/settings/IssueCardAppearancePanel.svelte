<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Root as Select } from '$lib/components/shadcn/select/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import SettingOverrideIndicator from '$lib/components/derived/setting-override-indicator/SettingOverrideIndicator.svelte';
	import {
		ISSUE_CARD_VARIANTS,
		ISSUE_CARD_SETTING_RANGES,
		VARIANT_SPECIFIC_SETTINGS,
		BUTTON_COLOR_OPTIONS,
		BADGE_STYLE_OPTIONS,
		PRIORITY_POSITION_OPTIONS,
		VARIANT_LABELS,
		BUTTON_COLOR_LABELS,
		SLIDER_LABELS,
		type IssueCardVariant,
		type IssueCardSettingKey,
		type RangeKey,
	} from '$lib/components/blocks/issue-card/index.js';
	import { useIssueCardSettings } from '$lib/components/blocks/issue-card/index.js';

	const settingsCtx = useIssueCardSettings();

	const activeVariant = $derived(settingsCtx.settings.variant);

	const variantSpecificKeys = $derived(
		VARIANT_SPECIFIC_SETTINGS[activeVariant] as readonly IssueCardSettingKey[],
	);

	const BADGE_STYLE_LABELS: Record<string, string> = {
		solid: 'Solid (A)',
		'borderless-dark': 'Borderless Dark (B)',
		'bordered-dark': 'Bordered Dark (C)',
	};

	function isVariantSpecificVisible(key: IssueCardSettingKey): boolean {
		return variantSpecificKeys.includes(key);
	}

	function handleSliderChange(key: IssueCardSettingKey, event: Event) {
		const target = event.target as HTMLInputElement;
		void settingsCtx.updateSetting(key, Number(target.value));
	}

	function handleSelectChange(key: IssueCardSettingKey, value: string) {
		void settingsCtx.updateSetting(key, value);
	}
</script>

<section class="space-y-4">
	<h2 class="text-lg font-medium">Issue Cards</h2>
	<p class="text-sm text-muted-foreground">
		Customize the appearance of issue cards across all workspaces.
	</p>

	<!-- Variant Selector -->
	<div class="space-y-2">
		<Label>Card Variant</Label>
		<div class="flex gap-2">
			{#each Object.keys(ISSUE_CARD_VARIANTS) as variantKey (variantKey)}
				{@const v = variantKey as IssueCardVariant}
				<Button
					intent={activeVariant === v ? 'primary' : 'secondary'}
					size="sm"
					onclick={() => handleSelectChange('variant', v)}
				>
					{VARIANT_LABELS[v]}
				</Button>
			{/each}
		</div>
		<SettingOverrideIndicator
			overridden={settingsCtx.isOverridden('variant')}
			onreset={() => void settingsCtx.resetOverride('variant')}
		/>
	</div>

	<Separator />

	<!-- Shared Settings -->
	<div class="space-y-3">
		<h3 class="text-sm font-medium text-muted-foreground">General</h3>

		<!-- Button Color -->
		<div class="flex items-center justify-between">
			<Label for="ic-button-color">Button Color</Label>
			<Select
				id="ic-button-color"
				class="w-40"
				value={settingsCtx.settings.buttonColor}
				onchange={(event) => {
					const target = event.currentTarget as HTMLSelectElement;
					handleSelectChange('buttonColor', target.value);
				}}
			>
				{#each BUTTON_COLOR_OPTIONS as option (option)}
					<option value={option}>{BUTTON_COLOR_LABELS[option] ?? option}</option>
				{/each}
			</Select>
		</div>

		<!-- Badge Style -->
		<div class="flex items-center justify-between">
			<Label for="ic-badge-style">Badge Style</Label>
			<Select
				id="ic-badge-style"
				class="w-52"
				value={settingsCtx.settings.badgeStyle}
				onchange={(event) => {
					const target = event.currentTarget as HTMLSelectElement;
					handleSelectChange('badgeStyle', target.value);
				}}
			>
				{#each BADGE_STYLE_OPTIONS as option (option)}
					<option value={option}>{BADGE_STYLE_LABELS[option] ?? option}</option>
				{/each}
			</Select>
		</div>

		<!-- Priority Position -->
		<div class="flex items-center justify-between">
			<Label for="ic-priority-position">Priority Position</Label>
			<Select
				id="ic-priority-position"
				class="w-48"
				value={settingsCtx.settings.priorityPosition}
				onchange={(event) => {
					const target = event.currentTarget as HTMLSelectElement;
					handleSelectChange('priorityPosition', target.value);
				}}
			>
				{#each PRIORITY_POSITION_OPTIONS as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</Select>
		</div>

		<!-- Shared sliders: Label Tint, Overlay Glow -->
		{#each ['labelTint', 'overlayGlow'] as key (key)}
			{@const settingKey = key as IssueCardSettingKey}
			{@const range = ISSUE_CARD_SETTING_RANGES[key as RangeKey]}
			{@const value = settingsCtx.settings[settingKey] as number}
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<Label>{SLIDER_LABELS[key]}</Label>
					<span class="text-xs tabular-nums text-muted-foreground">{value}%</span>
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
				<SettingOverrideIndicator
					overridden={settingsCtx.isOverridden(settingKey)}
					onreset={() => void settingsCtx.resetOverride(settingKey)}
				/>
			</div>
		{/each}
	</div>

	<!-- Variant-Specific Settings -->
	{#if variantSpecificKeys.length > 0}
		<Separator />
		<div class="space-y-3">
			<h3 class="text-sm font-medium text-muted-foreground">
				{VARIANT_LABELS[activeVariant]} Settings
			</h3>
			{#each ['gradientReach', 'colorSaturation', 'headerSaturation', 'radialIntensity'] as key (key)}
				{@const settingKey = key as IssueCardSettingKey}
				{#if isVariantSpecificVisible(settingKey)}
					{@const range = ISSUE_CARD_SETTING_RANGES[key as RangeKey]}
					{@const value = settingsCtx.settings[settingKey] as number}
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<Label>{SLIDER_LABELS[key]}</Label>
							<span class="text-xs tabular-nums text-muted-foreground">{value}%</span>
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
						{#if settingsCtx.isOverridden(settingKey)}
							<span class="text-xs text-muted-foreground">● Workspace override</span>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</section>
