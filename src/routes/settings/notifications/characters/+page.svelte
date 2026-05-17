<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useCharacterPacks } from '$lib/modules/character-packs';
	import { CharacterListCard, BulkImportWizard } from '$lib/components/blocks/character/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';

	const characterPacks = useCharacterPacks();

	let bulkImportOpen = $state(false);
	let deletePackId = $state<string | null>(null);
	let deletePackName = $state('');
</script>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-medium">Characters</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Characters assign sounds to notification events. Enabled characters are randomly
				assigned to new issues.
			</p>
		</div>
		<div class="flex gap-2">
			<Button intent="secondary" size="sm" onclick={() => (bulkImportOpen = true)}>
				<FolderOpenIcon data-icon="inline-start" />
				Import Folder
			</Button>
			<Button size="sm" onclick={() => void goto(resolve('/settings/character-creator'))}>
				<PlusIcon data-icon="inline-start" />
				Create Character
			</Button>
		</div>
	</div>

	<div class="space-y-2">
		{#each characterPacks.packs as pack (pack.id)}
			<CharacterListCard
				{pack}
				onedit={() =>
					// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL built with resolve() + dynamic search params
					void goto(resolve('/settings/character-creator') + `?packId=${pack.id}`)}
				ondelete={() => {
					deletePackId = pack.id;
					deletePackName = pack.display_name;
				}}
				ontoggle={(enabled) => void characterPacks.toggleEnabled(pack.id, enabled)}
			/>
		{/each}

		{#if characterPacks.packs.length === 0 && characterPacks.loading === false}
			<p class="py-4 text-center text-sm text-muted-foreground">
				No characters yet. Create one or import from a folder.
			</p>
		{/if}
	</div>
</section>

<BulkImportWizard bind:open={bulkImportOpen} onimported={() => void characterPacks.loadPacks()} />

<Dialog.Root
	open={deletePackId !== null}
	onOpenChange={(o) => {
		if (o === false) {
			deletePackId = null;
		}
	}}
>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete "{deletePackName}"?</Dialog.Title>
			<Dialog.Description>
				This will permanently delete the character and all its sound files. Issues using
				this character will be reset to the default pack.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button intent="ghost" onclick={() => (deletePackId = null)}>Cancel</Button>
			<Button
				intent="danger"
				onclick={async () => {
					if (deletePackId !== null) {
						await characterPacks.deletePack(deletePackId);
						deletePackId = null;
					}
				}}
			>
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
