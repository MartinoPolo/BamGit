<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { useRawRequirements } from '$lib/modules/raw-requirements/index.js';
	import { onMount } from 'svelte';

	const rawRequirementsCtx = useRawRequirements();

	let newNoteContent = $state('');
	let editContent = $state('');
	let newNoteTextareaElement = $state<HTMLTextAreaElement | null>(null);

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

	function startEditing(index: number) {
		rawRequirementsCtx.editingIndex = index;
		editContent = rawRequirementsCtx.notes[index].content;
	}

	function cancelEditing() {
		rawRequirementsCtx.editingIndex = null;
		editContent = '';
	}

	async function saveEdit(index: number) {
		await rawRequirementsCtx.updateNote(index, editContent);
		editContent = '';
	}

	function handleEditKeydown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void saveEdit(index);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
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
			bind:ref={newNoteTextareaElement}
			class="min-h-[80px] text-sm"
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
			{#each rawRequirementsCtx.notes as note, index (note.timestamp + index)}
				<div class="group rounded-lg border border-border p-4">
					<div class="mb-1 flex items-center justify-between">
						<span class="text-xs text-muted-foreground">
							{note.timestamp}
						</span>
						<div class="flex items-center gap-1">
							{#if note.processed}
								<Badge variant="default" class="text-[length:var(--text-2xs)]">
									{m.raw_requirements_processed()}
								</Badge>
							{/if}
							{#if rawRequirementsCtx.editingIndex !== index}
								<Button
									variant="ghost"
									size="icon-sm"
									class="opacity-0 transition-opacity group-hover:opacity-100"
									onclick={() => startEditing(index)}
								>
									<PencilIcon />
									<span class="sr-only">{m.raw_requirements_edit()}</span>
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									class="opacity-0 transition-opacity group-hover:opacity-100"
									onclick={() => void rawRequirementsCtx.toggleProcessed(index)}
								>
									<TrashIcon />
									<span class="sr-only">Toggle processed</span>
								</Button>
							{/if}
						</div>
					</div>

					{#if rawRequirementsCtx.editingIndex === index}
						<Textarea
							class="min-h-[60px] text-sm"
							value={editContent}
							oninput={(event) => {
								editContent = event.currentTarget.value;
							}}
							onkeydown={(event) => handleEditKeydown(event, index)}
						/>
						<div class="mt-2 flex justify-end gap-1">
							<Button variant="ghost" size="sm" onclick={cancelEditing}>
								<XIcon />
								{m.raw_requirements_cancel_edit()}
							</Button>
							<Button
								variant="primary"
								size="sm"
								onclick={() => void saveEdit(index)}
							>
								<CheckIcon />
								{m.raw_requirements_save_edit()}
							</Button>
						</div>
					{:else}
						<p class="whitespace-pre-wrap text-sm text-muted-foreground">
							{note.content}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
