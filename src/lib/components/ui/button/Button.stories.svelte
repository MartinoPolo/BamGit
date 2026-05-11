<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Button } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/Button',
		component: Button,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: [
					'primary',
					'secondary',
					'ghost',
					'ghost-overlay',
					'danger',
					'contextual-primary',
				],
			},
			size: {
				control: 'select',
				options: ['sm', 'md', 'lg', 'icon', 'icon-sm'],
			},
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { ButtonProps } from './button-variants.js';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import DeleteIcon from '@lucide/svelte/icons/delete';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
</script>

<Story name="Primary" args={{ variant: 'primary' }}>
	{#snippet template(args: ButtonProps)}
		<Button {...args}>Primary</Button>
	{/snippet}
</Story>

<Story name="Secondary">
	{#snippet template(args: ButtonProps)}
		<Button variant="secondary" {...args}>Secondary</Button>
	{/snippet}
</Story>

<Story name="Ghost">
	{#snippet template(args: ButtonProps)}
		<Button variant="ghost" {...args}>Ghost</Button>
	{/snippet}
</Story>

<Story name="Ghost Overlay">
	{#snippet template(args: ButtonProps)}
		<div class="flex gap-4">
			<div class="rounded-lg bg-primary p-4">
				<div class="flex items-center gap-2">
					<Button variant="ghost-overlay" size="icon-sm" {...args}><MailIcon /></Button>
					<Button variant="ghost-overlay" size="icon-sm" {...args}
						><SettingsIcon /></Button
					>
					<Button variant="ghost-overlay" {...args}>Action</Button>
				</div>
			</div>
			<div class="rounded-lg bg-surface-2 p-4">
				<div class="flex items-center gap-2">
					<Button variant="ghost-overlay" size="icon-sm" {...args}><MailIcon /></Button>
					<Button variant="ghost-overlay" size="icon-sm" {...args}
						><SettingsIcon /></Button
					>
					<Button variant="ghost-overlay" {...args}>Action</Button>
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Danger">
	{#snippet template(args: ButtonProps)}
		<Button variant="danger" {...args}>Danger</Button>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" disabled {...args}>Primary</Button>
			<Button variant="secondary" disabled {...args}>Secondary</Button>
			<Button variant="ghost" disabled {...args}>Ghost</Button>
			<Button variant="ghost-overlay" disabled {...args}>Ghost Overlay</Button>
			<Button variant="danger" disabled {...args}>Danger</Button>
		</div>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" {...args}>Primary</Button>
			<Button variant="secondary" {...args}>Secondary</Button>
			<Button variant="ghost" {...args}>Ghost</Button>
			<Button variant="ghost-overlay" {...args}>Ghost Overlay</Button>
			<Button variant="danger" {...args}>Danger</Button>
		</div>
	{/snippet}
</Story>

<Story name="All Sizes">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button size="sm" {...args}>Small</Button>
			<Button size="md" {...args}>Medium</Button>
			<Button size="lg" {...args}>Large</Button>
		</div>
	{/snippet}
</Story>

<Story name="Icon Only">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" size="icon" {...args}><PlusIcon /></Button>
			<Button variant="secondary" size="icon" {...args}><SettingsIcon /></Button>
			<Button variant="ghost" size="icon" {...args}><MailIcon /></Button>
			<Button variant="danger" size="icon" {...args}><TrashIcon /></Button>
			<Button variant="primary" size="icon-sm" {...args}><PlusIcon /></Button>
			<Button variant="ghost" size="icon-sm" {...args}><SettingsIcon /></Button>
		</div>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" {...args}><PlusIcon /> Create</Button>
			<Button variant="secondary" {...args}><SettingsIcon /> Settings</Button>
			<Button variant="ghost" {...args}><MailIcon /> Mail</Button>
			<Button variant="danger" {...args}><TrashIcon /> Delete</Button>
		</div>
	{/snippet}
</Story>

<Story name="Size x Variant Matrix">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-col gap-6">
			{#each ['sm', 'md', 'lg'] as const as size (size)}
				<div>
					<p class="mb-2 text-sm text-foreground-muted">{size}</p>
					<div class="flex flex-wrap items-center gap-3">
						<Button variant="primary" {size} {...args}>Primary</Button>
						<Button variant="secondary" {size} {...args}>Secondary</Button>
						<Button variant="ghost" {size} {...args}>Ghost</Button>
						<Button variant="danger" {size} {...args}>Danger</Button>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="With Keyboard Shortcuts">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-col gap-6">
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Primary with Enter shortcut</p>
				<Button variant="primary" {...args}>
					Create
					<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Ghost with Esc shortcut</p>
				<Button variant="ghost" {...args}>
					Cancel
					<Kbd>Esc</Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Ghost with Backspace shortcut</p>
				<Button variant="ghost" {...args}>
					Back
					<Kbd><DeleteIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Secondary with Enter shortcut</p>
				<Button variant="secondary" {...args}>
					Confirm
					<Kbd><CornerDownLeftIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Wizard footer example</p>
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="sm" {...args}>
						Back
						<Kbd><DeleteIcon /></Kbd>
					</Button>
					<div class="flex-1"></div>
					<Button variant="ghost" size="sm" {...args}>
						Cancel
						<Kbd>Esc</Kbd>
					</Button>
					<Button variant="primary" size="sm" {...args}>
						Create
						<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>
					</Button>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
