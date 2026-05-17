<script lang="ts">
	import { useSettings } from '$lib/modules/settings';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';
	import ColorThemePicker from '$lib/components/derived/color-theme-picker/ColorThemePicker.svelte';
	import { CHART_COLOR_THEME_OPTIONS } from '$lib/modules/usage/usage_types.js';

	const settings = useSettings();

	const startupOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'last-workspace', label: 'Last Workspace' },
	] as const;

	const currentStartup = $derived(settings.get('startupBehavior'));
	const currentChartTheme = $derived(settings.get('chartColorTheme'));
</script>

<div class="space-y-8">
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">Startup</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Choose what to show when the app launches.
			</p>
		</div>
		<Tabs class="w-fit *:justify-center">
			{#each startupOptions as option (option.value)}
				<Tab
					active={currentStartup === option.value}
					onclick={() => void settings.set('startupBehavior', option.value)}
				>
					{option.label}
				</Tab>
			{/each}
		</Tabs>
	</section>

	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">Chart Color Theme</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Default color scheme for usage charts and graphs.
			</p>
		</div>
		<ColorThemePicker
			options={CHART_COLOR_THEME_OPTIONS}
			value={currentChartTheme}
			onchange={(value) => void settings.set('chartColorTheme', value)}
			triggerLabel="Chart theme"
		/>
	</section>
</div>
