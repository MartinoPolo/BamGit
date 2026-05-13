<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { ALERT_VARIANTS, Alert, AlertAction, AlertDescription, AlertTitle } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Alert',
		component: Alert,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: [...ALERT_VARIANTS],
			},
		},
	});
</script>

<script lang="ts">
	import type { AlertProps } from './alert-variants.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import Button from '../button/Button.svelte';
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
					<Button variant="secondary" size="sm">Restart now</Button>
				</AlertAction>
			</Alert>
		</div>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template(args: AlertProps)}
		<div class="flex max-w-lg flex-col gap-3">
			{#each ALERT_VARIANTS as variant (variant)}
				<Alert {...args} {variant}>
					{#if variant === 'destructive'}
						<TriangleAlertIcon />
					{:else}
						<InfoIcon />
					{/if}
					<AlertTitle>{variant}</AlertTitle>
					<AlertDescription>Alert variant: {variant}.</AlertDescription>
				</Alert>
			{/each}
			<Alert>
				<TriangleAlertIcon />
				<AlertTitle>Update available</AlertTitle>
				<AlertDescription
					>A new version is available. Restart to apply the update.</AlertDescription
				>
				<AlertAction>
					<Button variant="secondary" size="sm">Restart now</Button>
				</AlertAction>
			</Alert>
			<Alert>
				<InfoIcon />
				<AlertDescription>Your changes have been saved successfully.</AlertDescription>
			</Alert>
		</div>
	{/snippet}
</Story>
