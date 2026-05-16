<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Command from '$lib/components/shadcn/command/index.js';
	import { onMount } from 'svelte';
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import type { AssignedIssue, SearchedGithubIssue } from '$lib/types/generated';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface Props {
		assignedIssues: AssignedIssue[];
	}

	let { assignedIssues }: Props = $props();

	const wizard = useCreationWizard();

	let commandValue = $state('');
	let inputElement = $state<HTMLInputElement | null>(null);

	const displayItems = $derived.by(() => {
		if (wizard.searchQuery.trim() !== '') {
			return wizard.searchResults;
		}
		return assignedIssues;
	});

	onMount(() => {
		inputElement?.focus();
	});

	function toSearchedIssue(item: AssignedIssue | SearchedGithubIssue): SearchedGithubIssue {
		return {
			number: item.number,
			title: item.title,
			state: item.state,
			url: item.url,
		};
	}

	function handleSelect(itemNumber: number) {
		const item = displayItems.find((i) => i.number === itemNumber);
		if (item) {
			wizard.selectGithubIssue(toSearchedIssue(item));
		}
	}

	export function confirm() {
		if (commandValue && displayItems.length > 0) {
			const itemNumber = Number(commandValue);
			const item = displayItems.find((i) => i.number === itemNumber);
			if (item) {
				wizard.selectGithubIssue(toSearchedIssue(item));
				return;
			}
		}
		wizard.skipGithubSearch();
	}
</script>

<div class="flex flex-col gap-3">
	<Command.Root shouldFilter={false} bind:value={commandValue} class="bg-transparent">
		<div class="relative">
			<Command.Input
				bind:ref={inputElement}
				bind:value={wizard.searchQuery}
				placeholder={m.wizard_search_placeholder()}
			/>
			{#if wizard.searching}
				<Loader2
					size={14}
					class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
				/>
			{/if}
		</div>

		<Command.List class="max-h-90">
			{#if wizard.skipNotice}
				<p class="text-center text-xs text-muted-foreground">
					{m.wizard_search_skipping()}
				</p>
			{:else if wizard.searchQuery.trim() !== '' && !wizard.searching && wizard.searchResults.length === 0}
				<Command.Empty>
					{m.wizard_search_empty()}
				</Command.Empty>
			{:else if displayItems.length > 0}
				{#snippet issueItem(item: AssignedIssue | SearchedGithubIssue)}
					<Command.Item
						value={String(item.number)}
						onSelect={() => handleSelect(item.number)}
						class="gap-2"
					>
						{#if item.state === 'OPEN'}
							<CircleDot class="shrink-0 text-gh-open" />
						{:else}
							<CircleCheck class="shrink-0 text-gh-closed" />
						{/if}
						<span class="min-w-0 truncate">#{item.number} {item.title}</span>
					</Command.Item>
				{/snippet}

				{#if wizard.searchQuery.trim() === '' && assignedIssues.length > 0}
					<Command.Group heading={m.wizard_assigned_heading()}>
						{#each displayItems as item (item.number)}
							{@render issueItem(item)}
						{/each}
					</Command.Group>
				{:else}
					{#each displayItems as item (item.number)}
						{@render issueItem(item)}
					{/each}
				{/if}
			{/if}
		</Command.List>
	</Command.Root>

	<button
		type="button"
		onclick={() => wizard.skipGithubSearch()}
		class="text-xs text-muted-foreground underline-offset-2 hover:underline"
	>
		{m.wizard_search_skip()}
	</button>
</div>
