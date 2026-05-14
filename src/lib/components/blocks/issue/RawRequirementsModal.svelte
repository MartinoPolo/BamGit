<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Textarea } from '$lib/components/shadcn/textarea/index.js';
	import NoteCard from '$lib/components/blocks/workspace/NoteCard.svelte';
	import { useRawRequirements } from '$lib/modules/raw-requirements/index.js';
	import { resolve } from '$app/paths';

	const FULL_PAGE_NOTE_THRESHOLD = 6;

	const rawRequirementsCtx = useRawRequirements();

	let newNoteContent = $state('');
	let newNoteTextareaElement = $state<HTMLTextAreaElement | null>(null);
	let notesContainerElement = $state<HTMLDivElement | null>(null);

	function handleDialogOpenChange(isOpen: boolean) {
		rawRequirementsCtx.open = isOpen;
		if (isOpen) {
			newNoteContent = '';
			requestAnimationFrame(() => {
				newNoteTextareaElement?.focus();
				if (notesContainerElement) {
					notesContainerElement.scrollTop = notesContainerElement.scrollHeight;
				}
			});
		}
	}

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
		requestAnimationFrame(() => {
			if (notesContainerElement) {
				notesContainerElement.scrollTop = notesContainerElement.scrollHeight;
			}
		});
	}
</script>

<Dialog.Root open={rawRequirementsCtx.open} onOpenChange={handleDialogOpenChange}>
	<Dialog.Content class="max-w-175 h-[90vh] flex flex-col p-0">
		<Dialog.Header>
			<Dialog.Title>{m.raw_requirements_title()}</Dialog.Title>
		</Dialog.Header>

		<Dialog.Body bind:ref={notesContainerElement} class="flex-1 overflow-y-auto">
			{#if rawRequirementsCtx.notes.length === 0}
				<p class="text-sm text-muted-foreground">{m.raw_requirements_empty()}</p>
			{:else}
				<div class="flex flex-col gap-3">
					{#each rawRequirementsCtx.notes as note, index (note.timestamp + index)}
						<NoteCard {note} {index} />
					{/each}
				</div>
			{/if}
		</Dialog.Body>

		<div class="border-t border-border px-5 py-4">
			<Textarea
				bind:ref={newNoteTextareaElement}
				class="min-h-20 text-sm"
				placeholder={m.raw_requirements_placeholder()}
				value={newNoteContent}
				oninput={(event) => {
					newNoteContent = event.currentTarget.value;
				}}
				onkeydown={handleNewNoteKeydown}
			/>
			<div class="mt-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					{#if rawRequirementsCtx.hasNotes}
						<WithTooltip
							text={m.raw_requirements_process_coming_soon()}
							side="top"
							sideOffset={6}
						>
							{#snippet asChild(props)}
								<span {...props}>
									<Button intent="secondary" size="sm" disabled>
										<SparklesIcon />
										{m.raw_requirements_process()}
									</Button>
								</span>
							{/snippet}
						</WithTooltip>
					{/if}
					{#if rawRequirementsCtx.notes.length >= FULL_PAGE_NOTE_THRESHOLD}
						<Button
							intent="ghost"
							size="sm"
							onclick={() => {
								rawRequirementsCtx.close();
							}}
							href={resolve('/quick-ideas')}
						>
							<ExternalLinkIcon />
							{m.raw_requirements_full_page()}
						</Button>
					{/if}
				</div>
				<Button
					intent="primary"
					size="sm"
					disabled={newNoteContent.trim() === ''}
					onclick={() => void submitNewNote()}
				>
					{m.raw_requirements_save()}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
