<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import type { AssignedIssue, SearchedGithubIssue } from '$lib/types/generated';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface Props {
		assignedIssues: AssignedIssue[];
	}

	let { assignedIssues }: Props = $props();

	const wizard = useCreationWizard();

	let selectedIndex = $state(0);
	let inputElement = $state<HTMLInputElement | null>(null);

	const displayItems = $derived.by(() => {
		if (wizard.searchQuery.trim() !== '') {
			return wizard.searchResults;
		}
		return assignedIssues;
	});

	let previousDisplayLength = 0;
	$effect(() => {
		const currentLength = displayItems.length;
		if (currentLength !== previousDisplayLength) {
			previousDisplayLength = currentLength;
			selectedIndex = 0;
		}
	});

	$effect(() => {
		inputElement?.focus();
	});

	function moveSelection(delta: number) {
		if (displayItems.length > 0) {
			selectedIndex = (selectedIndex + delta + displayItems.length) % displayItems.length;
		}
	}

	function confirmSelection() {
		if (displayItems.length > 0 && selectedIndex < displayItems.length) {
			wizard.selectGithubIssue(displayItems[selectedIndex] as SearchedGithubIssue);
		} else {
			wizard.skipGithubSearch();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			moveSelection(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			moveSelection(-1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			confirmSelection();
		}
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		wizard.updateSearchQuery(target.value);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-3" onkeydown={handleKeydown}>
	<div class="relative">
		<SearchIcon
			size={14}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			bind:ref={inputElement}
			value={wizard.searchQuery}
			oninput={handleInput}
			placeholder={m.wizard_search_placeholder()}
			class="pl-9"
		/>
		{#if wizard.searching}
			<Loader2
				size={14}
				class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
			/>
		{/if}
	</div>

	{#if wizard.skipNotice}
		<p class="text-center text-xs text-muted-foreground">{m.wizard_search_skipping()}</p>
	{:else if wizard.searchQuery.trim() !== '' && !wizard.searching && wizard.searchResults.length === 0}
		<div class="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
			<p>{m.wizard_search_empty()}</p>
		</div>
	{:else if displayItems.length > 0}
		<div class="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
			{#if wizard.searchQuery.trim() === '' && assignedIssues.length > 0}
				<p
					class="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
				>
					{m.wizard_assigned_heading()}
				</p>
			{/if}
			{#each displayItems as item, index (item.number)}
				<button
					type="button"
					onclick={() => wizard.selectGithubIssue(item as SearchedGithubIssue)}
					class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors
						{index === selectedIndex
						? 'bg-accent text-accent-foreground'
						: 'text-foreground hover:bg-accent/50'}"
				>
					{#if item.state === 'OPEN'}
						<CircleDot size={14} class="shrink-0 text-green-400" />
					{:else}
						<CircleCheck size={14} class="shrink-0 text-purple-400" />
					{/if}
					<span class="min-w-0 truncate">#{item.number} {item.title}</span>
				</button>
			{/each}
		</div>
	{/if}

	<button
		type="button"
		onclick={() => wizard.skipGithubSearch()}
		class="text-xs text-muted-foreground underline-offset-2 hover:underline"
	>
		{m.wizard_search_skip()}
	</button>
</div>
