<script lang="ts">
	import { useSettings } from '$lib/modules/settings';
	import { getAllUserSettings, setUserSetting } from '$lib/modules/settings/settings_commands.js';
	import { invoke } from '$lib/tauri.js';
	import { useToasts } from '$lib/modules/toasts/index.js';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import ColorThemePicker from '$lib/components/derived/color-theme-picker/ColorThemePicker.svelte';
	import { CHART_COLOR_THEME_OPTIONS } from '$lib/modules/usage/usage_types.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';

	const settings = useSettings();
	const toasts = useToasts();

	const startupOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'last-workspace', label: 'Last Workspace' },
	] as const;

	const currentStartup = $derived(settings.get('startupBehavior'));
	const currentChartTheme = $derived(settings.get('chartColorTheme'));

	async function handleExport() {
		try {
			const allSettings = await getAllUserSettings();
			const data: Record<string, string> = {};
			for (const setting of allSettings) {
				data[setting.key] = setting.value;
			}
			const json = JSON.stringify(data, null, 2);
			await invoke('save_file', {
				content: json,
				defaultName: 'grovekeeper-settings.json',
				filterName: 'JSON',
				filterExtensions: ['json'],
			});
			toasts.show({ tone: 'success', title: 'Settings exported' });
		} catch (error) {
			toasts.show({ tone: 'danger', title: 'Export failed', body: String(error) });
		}
	}

	async function handleImport() {
		try {
			const content: string | null = await invoke('open_file', {
				filterName: 'JSON',
				filterExtensions: ['json'],
			});
			if (content === null) {
				return;
			}
			const data = JSON.parse(content) as Record<string, unknown>;
			if (typeof data !== 'object' || data === null || Array.isArray(data)) {
				toasts.show({ tone: 'danger', title: 'Invalid settings file' });
				return;
			}
			let count = 0;
			for (const [key, value] of Object.entries(data)) {
				if (typeof value === 'string') {
					await setUserSetting(key, value);
					count++;
				}
			}
			await settings.loadSettings();
			toasts.show({ tone: 'success', title: `Imported ${count} settings` });
		} catch (error) {
			toasts.show({ tone: 'danger', title: 'Import failed', body: String(error) });
		}
	}
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

	<Separator />

	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">Configuration</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Export or import your user settings as a JSON file.
			</p>
		</div>
		<div class="flex gap-2">
			<Button intent="secondary" size="sm" onclick={handleExport}>
				<DownloadIcon data-icon="inline-start" />
				Export Settings
			</Button>
			<Button intent="secondary" size="sm" onclick={handleImport}>
				<UploadIcon data-icon="inline-start" />
				Import Settings
			</Button>
		</div>
	</section>
</div>
