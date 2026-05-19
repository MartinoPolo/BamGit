<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SimpleDropdownMenu from './SimpleDropdownMenu.svelte';

	const { Story } = defineMeta({
		title: 'Derived/SimpleDropdownMenu',
		component: SimpleDropdownMenu,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import ShareIcon from '@lucide/svelte/icons/share-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
</script>

<Story name="Default">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				items={[
					{ label: 'Edit', onSelect: () => console.log('Edit') },
					{ label: 'Duplicate', onSelect: () => console.log('Duplicate') },
					{ label: 'Archive', onSelect: () => console.log('Archive') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary">
						Options
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				{/snippet}
			</SimpleDropdownMenu>
		</div>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				items={[
					{ label: 'Edit', icon: PencilIcon, onSelect: () => console.log('Edit') },
					{ label: 'Copy', icon: CopyIcon, onSelect: () => console.log('Copy') },
					{
						label: 'Download',
						icon: DownloadIcon,
						onSelect: () => console.log('Download'),
					},
					{ label: 'Share', icon: ShareIcon, onSelect: () => console.log('Share') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary">
						Actions
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				{/snippet}
			</SimpleDropdownMenu>
		</div>
	{/snippet}
</Story>

<Story name="With Destructive">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				items={[
					{ label: 'Edit', icon: PencilIcon, onSelect: () => console.log('Edit') },
					{ label: 'Copy', icon: CopyIcon, onSelect: () => console.log('Copy') },
					{
						label: 'Delete',
						icon: TrashIcon,
						onSelect: () => console.log('Delete'),
						destructive: true,
					},
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary">
						Actions
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				{/snippet}
			</SimpleDropdownMenu>
		</div>
	{/snippet}
</Story>

<Story name="Disabled Items">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				items={[
					{ label: 'Edit', icon: PencilIcon, onSelect: () => console.log('Edit') },
					{
						label: 'Share (unavailable)',
						icon: ShareIcon,
						onSelect: () => console.log('Share'),
						disabled: true,
					},
					{
						label: 'Settings (unavailable)',
						icon: SettingsIcon,
						onSelect: () => console.log('Settings'),
						disabled: true,
					},
					{
						label: 'Delete',
						icon: TrashIcon,
						onSelect: () => console.log('Delete'),
						destructive: true,
					},
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary">
						Manage
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				{/snippet}
			</SimpleDropdownMenu>
		</div>
	{/snippet}
</Story>

<Story name="Custom Alignment">
	{#snippet template()}
		<div class="flex items-center justify-center gap-6 p-8">
			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				side="bottom"
				align="start"
				items={[
					{ label: 'Option A', onSelect: () => console.log('A') },
					{ label: 'Option B', onSelect: () => console.log('B') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary" size="sm">Bottom Start</Button>
				{/snippet}
			</SimpleDropdownMenu>

			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				side="bottom"
				align="center"
				items={[
					{ label: 'Option A', onSelect: () => console.log('A') },
					{ label: 'Option B', onSelect: () => console.log('B') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary" size="sm">Bottom Center</Button>
				{/snippet}
			</SimpleDropdownMenu>

			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				side="bottom"
				align="end"
				items={[
					{ label: 'Option A', onSelect: () => console.log('A') },
					{ label: 'Option B', onSelect: () => console.log('B') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary" size="sm">Bottom End</Button>
				{/snippet}
			</SimpleDropdownMenu>

			<SimpleDropdownMenu
				portalProps={{ disabled: true }}
				side="top"
				align="end"
				items={[
					{ label: 'Option A', onSelect: () => console.log('A') },
					{ label: 'Option B', onSelect: () => console.log('B') },
				]}
			>
				{#snippet trigger()}
					<Button intent="secondary" size="sm">Top End</Button>
				{/snippet}
			</SimpleDropdownMenu>
		</div>
	{/snippet}
</Story>
