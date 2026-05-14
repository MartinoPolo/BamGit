<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NoteCard from './NoteCard.svelte';
	import type { RawRequirementNote } from '$lib/modules/raw-requirements/index.js';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/NoteCard',
		component: NoteCard,
		tags: ['autodocs'],
	});

	function makeMockNote(overrides: Partial<RawRequirementNote> = {}): RawRequirementNote {
		return {
			timestamp: '2026-05-10 14:30',
			content: 'Add keyboard shortcut for quick issue creation',
			processed: false,
			...overrides,
		};
	}
</script>

<script lang="ts">
	import NoteCardStoryWrapper from './NoteCardStoryWrapper.svelte';
</script>

<Story name="Default" args={{ note: makeMockNote(), index: 0 }}>
	{#snippet template(args: { note: RawRequirementNote; index: number })}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard note={args.note} index={args.index} />
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty Content" args={{ note: makeMockNote({ content: '' }), index: 1 }}>
	{#snippet template(args: { note: RawRequirementNote; index: number })}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard note={args.note} index={args.index} />
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Long Note"
	args={{
		note: makeMockNote({
			content:
				'This is a very long note that tests overflow behavior. It contains multiple sentences to simulate real-world usage where users might write extensive requirements or ideas. The card should handle this gracefully without breaking the layout. Additional text is added here to ensure wrapping and scrolling behavior can be observed in the story preview. Consider edge cases like word-break on extremely long unbroken strings and whitespace preservation in pre-wrap mode.',
		}),
		index: 2,
	}}
>
	{#snippet template(args: { note: RawRequirementNote; index: number })}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard note={args.note} index={args.index} />
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Processed" args={{ note: makeMockNote({ processed: true }), index: 3 }}>
	{#snippet template(args: { note: RawRequirementNote; index: number })}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard note={args.note} index={args.index} />
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="With Toggle Processed"
	args={{
		note: makeMockNote(),
		index: 4,
		showToggleProcessed: true,
	}}
>
	{#snippet template(args: {
		note: RawRequirementNote;
		index: number;
		showToggleProcessed?: boolean;
	})}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard
					note={args.note}
					index={args.index}
					showToggleProcessed={args.showToggleProcessed}
				/>
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Processed With Toggle"
	args={{
		note: makeMockNote({ processed: true }),
		index: 5,
		showToggleProcessed: true,
	}}
>
	{#snippet template(args: {
		note: RawRequirementNote;
		index: number;
		showToggleProcessed?: boolean;
	})}
		<NoteCardStoryWrapper>
			<div class="max-w-md p-8">
				<NoteCard
					note={args.note}
					index={args.index}
					showToggleProcessed={args.showToggleProcessed}
				/>
			</div>
		</NoteCardStoryWrapper>
	{/snippet}
</Story>
