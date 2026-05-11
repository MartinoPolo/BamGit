<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Kbd } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/Kbd',
		component: Kbd,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { KbdProps } from './kbd-variants.js';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import DeleteIcon from '@lucide/svelte/icons/delete';
</script>

<Story name="Single Key">
	{#snippet template(args: KbdProps)}
		<Kbd {...args}>K</Kbd>
	{/snippet}
</Story>

<Story name="Modifier Keys">
	{#snippet template(args: KbdProps)}
		<div class="flex items-center gap-1">
			<Kbd {...args}>Ctrl</Kbd>
			<span class="text-foreground-muted">+</span>
			<Kbd {...args}>K</Kbd>
		</div>
	{/snippet}
</Story>

<Story name="Common Shortcuts">
	{#snippet template(args: KbdProps)}
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<span class="w-32 text-sm text-foreground-muted">Save</span>
				<div class="flex items-center gap-1">
					<Kbd {...args}>Ctrl</Kbd>
					<span class="text-foreground-muted">+</span>
					<Kbd {...args}>S</Kbd>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-32 text-sm text-foreground-muted">Search</span>
				<div class="flex items-center gap-1">
					<Kbd {...args}>Ctrl</Kbd>
					<span class="text-foreground-muted">+</span>
					<Kbd {...args}>K</Kbd>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-32 text-sm text-foreground-muted">Undo</span>
				<div class="flex items-center gap-1">
					<Kbd {...args}>Ctrl</Kbd>
					<span class="text-foreground-muted">+</span>
					<Kbd {...args}>Z</Kbd>
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Special Keys">
	{#snippet template(args: KbdProps)}
		<div class="flex items-center gap-2">
			<Kbd {...args}>Esc</Kbd>
			<Kbd {...args}>Tab</Kbd>
			<Kbd {...args}>Enter</Kbd>
			<Kbd {...args}>Space</Kbd>
		</div>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template(args: KbdProps)}
		<div class="flex items-center gap-2">
			<Kbd {...args}><CornerDownLeftIcon /></Kbd>
			<Kbd {...args}><DeleteIcon /></Kbd>
			<Kbd {...args}>⌫</Kbd>
		</div>
	{/snippet}
</Story>

<Story name="Inverted (for primary buttons)">
	{#snippet template(args: KbdProps)}
		<div class="flex items-center gap-2 rounded-md bg-primary p-4">
			<Kbd variant="inverted" {...args}>Esc</Kbd>
			<Kbd variant="inverted" {...args}><CornerDownLeftIcon /></Kbd>
			<Kbd variant="inverted" {...args}><DeleteIcon /></Kbd>
		</div>
	{/snippet}
</Story>
