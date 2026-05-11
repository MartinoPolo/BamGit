<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import NoteCard from '$lib/components/blocks/workspace/NoteCard.svelte';
	import { useRawRequirements } from '$lib/modules/raw-requirements/index.js';
	import { onMount } from 'svelte';

	const rawRequirementsCtx = useRawRequirements();

	let newNoteContent = $state('');

	onMount(() => {
		void rawRequirementsCtx.load();
	});

	function handleNewNoteKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void submitNewNote();
		}
	}

	async function submitNewNote() {
		if (newNoteContent.trim() === '') {
			return;
		}
		await rawRequirementsCtx.addNote(newNoteContent);
		newNoteContent = '';
	}
</script>

<div class="flex flex-col gap-6 p-8">
	<div>
		<h1 class="text-2xl font-bold text-foreground">
			{m.raw_requirements_full_page_title()}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m.raw_requirements_full_page_subtitle()}
		</p>
	</div>

	<div class="max-w-2xl">
		<Textarea
			class="min-h-20 text-sm"
			placeholder={m.raw_requirements_placeholder()}
			value={newNoteContent}
			oninput={(event) => {
				newNoteContent = event.currentTarget.value;
			}}
			onkeydown={handleNewNoteKeydown}
		/>
		<div class="mt-2 flex justify-end">
			<Button
				variant="primary"
				size="sm"
				disabled={newNoteContent.trim() === ''}
				onclick={() => void submitNewNote()}
			>
				{m.raw_requirements_save()}
			</Button>
		</div>
	</div>

	{#if rawRequirementsCtx.notes.length === 0}
		<p class="text-sm text-muted-foreground">{m.raw_requirements_empty()}</p>
	{:else}
		<div class="flex max-w-2xl flex-col gap-3">
			{#each rawRequirementsCtx.notes as note, index (note.timestamp)}
				<NoteCard {note} {index} showToggleProcessed />
			{/each}
		</div>
	{/if}
</div>
