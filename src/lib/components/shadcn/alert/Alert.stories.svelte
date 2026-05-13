<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Alert, AlertDescription, AlertTitle, AlertAction } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Alert',
		component: Alert,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
</script>

<Story name="Default">
	{#snippet template(args)}
		<div class="w-96">
			<Alert {...args}>
				<AlertTitle>Heads up!</AlertTitle>
				<AlertDescription
					>You can add components to your app using the CLI.</AlertDescription
				>
			</Alert>
		</div>
	{/snippet}
</Story>

<Story name="Destructive">
	{#snippet template(args)}
		<div class="w-96">
			<Alert variant="destructive" {...args}>
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>Your session has expired. Please log in again.</AlertDescription>
			</Alert>
		</div>
	{/snippet}
</Story>

<Story name="With Icon">
	{#snippet template(args)}
		<div class="w-96">
			<Alert {...args}>
				<TerminalIcon />
				<AlertTitle>Terminal</AlertTitle>
				<AlertDescription>You can use the terminal to run commands.</AlertDescription>
			</Alert>
		</div>
	{/snippet}
</Story>

<Story name="Without Title">
	{#snippet template(args)}
		<div class="w-96">
			<Alert {...args}>
				<InfoIcon />
				<AlertDescription>Your changes have been saved successfully.</AlertDescription>
			</Alert>
		</div>
	{/snippet}
</Story>

<Story name="With Action Button">
	{#snippet template(args)}
		<div class="w-96">
			<Alert {...args}>
				<TriangleAlertIcon />
				<AlertTitle>Update available</AlertTitle>
				<AlertDescription
					>A new version is available. Restart to apply the update.</AlertDescription
				>
				<AlertAction>
					<button
						class="rounded border border-current px-2 py-1 text-xs font-medium hover:opacity-80"
					>
						Restart now
					</button>
				</AlertAction>
			</Alert>
		</div>
	{/snippet}
</Story>
