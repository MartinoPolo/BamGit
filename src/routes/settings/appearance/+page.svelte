<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { ACCENT_COLORS } from '$lib/modules/board';
	import { BACKGROUND_PALETTES } from '$lib/modules/board/types.js';
	import { useSettings } from '$lib/modules/settings';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';
	import SettingOverrideIndicator from '$lib/components/derived/setting-override-indicator/SettingOverrideIndicator.svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';

	const settingsCtx = useSettings();
	const themeMode = $derived(settingsCtx.getThemeMode());
	const accentColor = $derived(settingsCtx.getAccentColor());
	const themeOverridden = $derived(settingsCtx.isOverridden('themeMode'));
	const accentOverridden = $derived(settingsCtx.isOverridden('accentColor'));
	const backgroundPalette = $derived(settingsCtx.getBackgroundPalette());
	const paletteOverridden = $derived(settingsCtx.isOverridden('backgroundPalette'));

	const themeModes = [
		{ value: 'light' as const, Icon: Sun, label: () => m.theme_light() },
		{ value: 'dark' as const, Icon: Moon, label: () => m.theme_dark() },
		{ value: 'system' as const, Icon: Monitor, label: () => m.theme_system() },
	];

	const PALETTE_PREVIEW_COLORS: Record<string, string> = {
		forest: 'oklch(0.58 0.096 134)',
		'golden-hour': 'oklch(0.7 0.12 75)',
		twilight: 'oklch(0.6 0.1 220)',
	};

	function palettePreviewColor(palette: string): string {
		return PALETTE_PREVIEW_COLORS[palette] ?? 'oklch(0.5 0.05 150)';
	}

	function formatPaletteName(palette: string): string {
		return palette.replace(/-/g, ' ');
	}
</script>

<div class="flex flex-col gap-8">
	<!-- Theme Mode -->
	<section class="flex flex-col gap-4">
		<div class="flex items-center gap-2">
			<div>
				<h2 class="text-lg font-medium">Theme</h2>
				<p class="mt-1 text-sm text-muted-foreground">Choose how the app looks.</p>
			</div>
			<SettingOverrideIndicator
				overridden={themeOverridden}
				onreset={() => void settingsCtx.resetOverride('themeMode')}
			/>
		</div>
		<Tabs class="w-fit *:justify-center">
			{#each themeModes as { value, Icon, label } (value)}
				<Tab
					active={themeMode === value}
					onclick={() => void settingsCtx.set('themeMode', value)}
				>
					<Icon class="size-4" />
					<span>{label()}</span>
				</Tab>
			{/each}
		</Tabs>
	</section>

	<!-- Accent Color -->
	<section class="flex flex-col gap-4">
		<div class="flex items-center gap-2">
			<div>
				<h2 class="text-lg font-medium">{m.settings_accent_title()}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{m.settings_accent_description()}
				</p>
			</div>
			<SettingOverrideIndicator
				overridden={accentOverridden}
				onreset={() => void settingsCtx.resetOverride('accentColor')}
			/>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each ACCENT_COLORS as color (color)}
				<Button
					intent="secondary"
					size="sm"
					onclick={() => void settingsCtx.set('accentColor', color)}
					class="capitalize {accentColor === color
						? 'border-primary bg-surface-2 font-medium'
						: ''}"
				>
					<div
						class="size-4 rounded-full"
						style:background-color="var(--{color}-500)"
					></div>
					{color}
				</Button>
			{/each}
		</div>
	</section>

	<!-- Background Palette -->
	<section class="flex flex-col gap-4">
		<div class="flex items-center gap-2">
			<div>
				<h2 class="text-lg font-medium">Background Palette</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Set the color mood for the app background and forest view.
				</p>
			</div>
			<SettingOverrideIndicator
				overridden={paletteOverridden}
				onreset={() => void settingsCtx.resetOverride('backgroundPalette')}
			/>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each BACKGROUND_PALETTES as palette (palette)}
				<Button
					intent="secondary"
					size="sm"
					onclick={() => void settingsCtx.set('backgroundPalette', palette)}
					class="capitalize {backgroundPalette === palette
						? 'border-primary bg-surface-2 font-medium'
						: ''}"
				>
					<div
						class="size-4 rounded-full"
						style:background-color={palettePreviewColor(palette)}
					></div>
					{formatPaletteName(palette)}
				</Button>
			{/each}
		</div>
	</section>
</div>
