<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SyncBadge from './SyncBadge.svelte';

	interface StoryArgs {
		behindBaseCount: number;
	}

	const { Story } = defineMeta({
		title: 'Derived/SyncBadge',
		component: SyncBadge,
		tags: ['autodocs'],
		argTypes: {
			behindBaseCount: { control: 'number' },
		},
	});
</script>

<!-- behindBaseCount <= 0 renders nothing — the component is display-only when a worktree is behind base -->
<Story name="Up To Date (renders nothing)" args={{ behindBaseCount: 0 }}>
	{#snippet template(args: StoryArgs)}
		<div class="flex items-center gap-4 p-4">
			<span class="text-sm text-muted-foreground italic">
				No badge rendered — component returns nothing when behindBaseCount ≤ 0
			</span>
			<SyncBadge {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Behind By One" args={{ behindBaseCount: 1 }}>
	{#snippet template(args: StoryArgs)}
		<div class="flex items-center gap-4 p-4">
			<SyncBadge {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Behind By Many" args={{ behindBaseCount: 15 }}>
	{#snippet template(args: StoryArgs)}
		<div class="flex items-center gap-4 p-4">
			<SyncBadge {...args} />
		</div>
	{/snippet}
</Story>

<Story name="All Visible Variants">
	{#snippet template()}
		<div class="flex items-center gap-4 p-4">
			<SyncBadge behindBaseCount={1} />
			<SyncBadge behindBaseCount={3} />
			<SyncBadge behindBaseCount={5} />
			<SyncBadge behindBaseCount={6} />
			<SyncBadge behindBaseCount={15} />
		</div>
	{/snippet}
</Story>
