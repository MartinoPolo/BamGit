<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as ContextMenu from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/ContextMenu',
		component: ContextMenu.Root,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let checkboxChecked = $state(false);
	let radioValue = $state('middle');
</script>

<Story name="Basic Menu">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Item>Back</ContextMenu.Item>
				<ContextMenu.Item>Forward</ContextMenu.Item>
				<ContextMenu.Item>Reload</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item>View Source</ContextMenu.Item>
				<ContextMenu.Item>Inspect</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Item>
					<ScissorsIcon class="size-4" />
					Cut
					<ContextMenu.Shortcut>⌘X</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Item>
					<CopyIcon class="size-4" />
					Copy
					<ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Item>
					<ClipboardIcon class="size-4" />
					Paste
					<ContextMenu.Shortcut>⌘V</ContextMenu.Shortcut>
				</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item variant="destructive">
					<TrashIcon class="size-4" />
					Delete
					<ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="With Submenus">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Item>New File</ContextMenu.Item>
				<ContextMenu.Item>New Window</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
					<ContextMenu.Portal>
						<ContextMenu.SubContent>
							<ContextMenu.Item>Email</ContextMenu.Item>
							<ContextMenu.Item>Messages</ContextMenu.Item>
							<ContextMenu.Item>Slack</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Portal>
				</ContextMenu.Sub>
				<ContextMenu.Separator />
				<ContextMenu.Item>Settings</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="Disabled Items">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Item>Undo</ContextMenu.Item>
				<ContextMenu.Item>Redo</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item disabled>Cut</ContextMenu.Item>
				<ContextMenu.Item disabled>Copy</ContextMenu.Item>
				<ContextMenu.Item>Paste</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="Checkbox Items">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.CheckboxItem bind:checked={checkboxChecked}>
					Show Minimap
				</ContextMenu.CheckboxItem>
				<ContextMenu.CheckboxItem checked={true}>Word Wrap</ContextMenu.CheckboxItem>
				<ContextMenu.CheckboxItem checked={false}>Sticky Scroll</ContextMenu.CheckboxItem>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>

<Story name="Radio Items">
	{#snippet template()}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<div
					class="flex h-36 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
				>
					Right-click here
				</div>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Label>Panel Position</ContextMenu.Label>
				<ContextMenu.Separator />
				<ContextMenu.RadioGroup bind:value={radioValue}>
					<ContextMenu.RadioItem value="top">Top</ContextMenu.RadioItem>
					<ContextMenu.RadioItem value="middle">Middle</ContextMenu.RadioItem>
					<ContextMenu.RadioItem value="bottom">Bottom</ContextMenu.RadioItem>
				</ContextMenu.RadioGroup>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/snippet}
</Story>
