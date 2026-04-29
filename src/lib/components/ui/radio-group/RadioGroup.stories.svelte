<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { RadioGroup, RadioGroupItem } from './index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/RadioGroup',
		component: RadioGroup,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { RadioGroupProps } from './radio-group-variants.js';
</script>

<Story name="Default">
	{#snippet template(args: RadioGroupProps)}
		<RadioGroup value="claude" {...args}>
			<div class="flex items-center gap-2">
				<RadioGroupItem value="claude" id="r-claude" />
				<Label for="r-claude" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Claude</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<RadioGroupItem value="codex" id="r-codex" />
				<Label for="r-codex" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Codex</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<RadioGroupItem value="cursor" id="r-cursor" />
				<Label for="r-cursor" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Cursor</Label
				>
			</div>
		</RadioGroup>
	{/snippet}
</Story>

<Story name="Horizontal">
	{#snippet template(args: RadioGroupProps)}
		<RadioGroup value="claude" class="flex flex-row gap-4" {...args}>
			<div class="flex items-center gap-1.5">
				<RadioGroupItem value="claude" id="rh-claude" />
				<Label for="rh-claude" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Claude</Label
				>
			</div>
			<div class="flex items-center gap-1.5">
				<RadioGroupItem value="codex" id="rh-codex" />
				<Label for="rh-codex" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Codex</Label
				>
			</div>
			<div class="flex items-center gap-1.5">
				<RadioGroupItem value="cursor" id="rh-cursor" />
				<Label for="rh-cursor" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
					>Cursor</Label
				>
			</div>
		</RadioGroup>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: RadioGroupProps)}
		<RadioGroup value="claude" disabled {...args}>
			<div class="flex items-center gap-2">
				<RadioGroupItem value="claude" id="rd-claude" />
				<Label for="rd-claude" class="mb-0 text-[length:var(--text-md)] opacity-40"
					>Claude</Label
				>
			</div>
			<div class="flex items-center gap-2">
				<RadioGroupItem value="codex" id="rd-codex" />
				<Label for="rd-codex" class="mb-0 text-[length:var(--text-md)] opacity-40"
					>Codex</Label
				>
			</div>
		</RadioGroup>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(_args: RadioGroupProps)}
		<div class="grid grid-cols-4 gap-6">
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Rest</span>
				<RadioGroup>
					<RadioGroupItem value="x" />
				</RadioGroup>
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Selected</span>
				<RadioGroup value="x">
					<RadioGroupItem value="x" />
				</RadioGroup>
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled</span>
				<RadioGroup disabled>
					<RadioGroupItem value="x" />
				</RadioGroup>
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled + Selected</span>
				<RadioGroup value="x" disabled>
					<RadioGroupItem value="x" />
				</RadioGroup>
			</div>
			<div class="col-span-4 flex flex-col gap-2">
				<span class="text-xs text-foreground-subtle">Group</span>
				<RadioGroup value="claude" class="flex flex-row gap-4">
					<div class="flex items-center gap-1.5">
						<RadioGroupItem value="claude" id="rs-claude" />
						<Label
							for="rs-claude"
							class="mb-0 cursor-pointer text-[length:var(--text-md)]">Claude</Label
						>
					</div>
					<div class="flex items-center gap-1.5">
						<RadioGroupItem value="codex" id="rs-codex" />
						<Label
							for="rs-codex"
							class="mb-0 cursor-pointer text-[length:var(--text-md)]">Codex</Label
						>
					</div>
					<div class="flex items-center gap-1.5">
						<RadioGroupItem value="cursor" id="rs-cursor" />
						<Label
							for="rs-cursor"
							class="mb-0 cursor-pointer text-[length:var(--text-md)]">Cursor</Label
						>
					</div>
				</RadioGroup>
			</div>
		</div>
	{/snippet}
</Story>
