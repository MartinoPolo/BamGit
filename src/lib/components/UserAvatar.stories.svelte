<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import UserAvatar from './UserAvatar.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Components/UserAvatar',
		component: UserAvatar,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			collapsed: { control: 'boolean' },
			activeCount: { control: 'number' },
		},
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';

	type AvatarProps = ComponentProps<typeof UserAvatar>;
</script>

<Story
	name="Expanded"
	args={{ username: 'Martin', initials: 'MP', activeCount: 2, collapsed: false }}
>
	{#snippet template(args: AvatarProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<UserAvatar {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Collapsed"
	args={{ username: 'Martin', initials: 'MP', activeCount: 0, collapsed: true }}
>
	{#snippet template(args: AvatarProps)}
		<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
			<UserAvatar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="All States">
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- Storybook requires template arg -->
	{#snippet template(_args: AvatarProps)}
		<div class="flex gap-8">
			<div class="w-56 rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">Expanded</p>
				<UserAvatar username="Martin" initials="MP" activeCount={2} />
			</div>
			<div class="w-56 rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">
					Expanded (no active)
				</p>
				<UserAvatar username="Martin" initials="MP" activeCount={0} />
			</div>
			<div class="rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">Collapsed</p>
				<UserAvatar username="Martin" initials="MP" activeCount={0} collapsed />
			</div>
			<div class="rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">
					Collapsed (active)
				</p>
				<UserAvatar username="Martin" initials="MP" activeCount={3} collapsed />
			</div>
		</div>
	{/snippet}
</Story>
