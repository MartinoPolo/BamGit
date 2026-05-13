<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Separator } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Separator',
		component: Separator,
		tags: ['autodocs'],
	});
</script>

<Story name="Horizontal">
	{#snippet template()}
		<div class="w-64">
			<Separator orientation="horizontal" />
		</div>
	{/snippet}
</Story>

<Story name="Vertical">
	{#snippet template()}
		<div class="flex h-5 items-center gap-4">
			<span class="text-sm">Blog</span>
			<Separator orientation="vertical" />
			<span class="text-sm">Docs</span>
			<Separator orientation="vertical" />
			<span class="text-sm">Source</span>
		</div>
	{/snippet}
</Story>

<Story name="With Surrounding Content">
	{#snippet template()}
		<div class="w-72 space-y-4">
			<div>
				<p class="text-sm font-medium">Radix Primitives</p>
				<p class="text-muted-foreground text-sm">An open-source UI component library.</p>
			</div>
			<Separator />
			<div>
				<p class="text-sm font-medium">shadcn/ui</p>
				<p class="text-muted-foreground text-sm">Beautifully designed components.</p>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="In a Form">
	{#snippet template()}
		<div class="w-80 space-y-4">
			<div class="space-y-1">
				<p class="text-sm font-semibold">Personal Information</p>
				<p class="text-muted-foreground text-xs">Name and contact details.</p>
			</div>
			<Separator />
			<div class="space-y-1">
				<p class="text-sm font-semibold">Preferences</p>
				<p class="text-muted-foreground text-xs">Notification and display settings.</p>
			</div>
			<Separator />
			<div class="space-y-1">
				<p class="text-sm font-semibold">Danger Zone</p>
				<p class="text-muted-foreground text-xs">Irreversible account actions.</p>
			</div>
		</div>
	{/snippet}
</Story>
