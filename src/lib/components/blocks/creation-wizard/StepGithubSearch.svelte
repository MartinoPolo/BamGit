<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { SearchField } from '$lib/components/base/search-field/index.js';
	import { onMount, untrack } from 'svelte';
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

	let selectedIndex = $state(-1);
	let arrowDisplayValue = $state('');
	let isArrowSelecting = $state(false);
	let inputElement = $state<HTMLInputElement | null>(null);
	let listElement = $state<HTMLDivElement | null>(null);

	const displayItems = $derived.by(() => {
		if (wizard.searchQuery.trim() !== '') {
			return wizard.searchResults;
		}
		return assignedIssues;
	});

	const inputDisplayValue = $derived(isArrowSelecting ? arrowDisplayValue : wizard.searchQuery);

	$effect(() => {
		void displayItems.length;
		untrack(() => {
			selectedIndex = -1;
			isArrowSelecting = false;
			arrowDisplayValue = '';
		});
	});

	$effect(() => {
		const index = selectedIndex;
		if (listElement && index >= 0) {
			const child = listElement.querySelector(
				`[data-index="${index}"]`,
			) as HTMLElement | null;
			child?.scrollIntoView({ block: 'nearest' });
		}
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

	function moveSelection(delta: number) {
		if (displayItems.length === 0) {
			return;
		}

		if (selectedIndex === -1) {
			selectedIndex = delta > 0 ? 0 : displayItems.length - 1;
		} else {
			selectedIndex = (selectedIndex + delta + displayItems.length) % displayItems.length;
		}

		const item = displayItems[selectedIndex];
		arrowDisplayValue = `#${item.number} ${item.title}`;
		isArrowSelecting = true;
	}

	function confirmSelection() {
		if (selectedIndex >= 0 && selectedIndex < displayItems.length) {
			wizard.selectGithubIssue(toSearchedIssue(displayItems[selectedIndex]));
		} else {
			wizard.skipGithubSearch();
		}
	}

	export function confirm() {
		confirmSelection();
	}

	export function handleArrow(delta: number) {
		moveSelection(delta);
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
			event.stopPropagation();
			confirmSelection();
		}
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		isArrowSelecting = false;
		arrowDisplayValue = '';
		wizard.updateSearchQuery(target.value);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-3" onkeydown={handleKeydown}>
	<SearchField
		bind:ref={inputElement}
		value={inputDisplayValue}
		oninput={handleInput}
		placeholder={m.wizard_search_placeholder()}
	>
		{#if wizard.searching}
			<Loader2
				size={14}
				class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
			/>
		{/if}
	</SearchField>

	{#if wizard.skipNotice}
		<p class="text-center text-xs text-muted-foreground">{m.wizard_search_skipping()}</p>
	{:else if wizard.searchQuery.trim() !== '' && !wizard.searching && wizard.searchResults.length === 0}
		<div class="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
			<p>{m.wizard_search_empty()}</p>
		</div>
	{:else if displayItems.length > 0}
		<div bind:this={listElement} class="flex max-h-90 flex-col gap-0.5 overflow-y-auto">
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
					data-index={index}
					onclick={() => wizard.selectGithubIssue(toSearchedIssue(item))}
					class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors
						{index === selectedIndex
						? 'bg-primary-soft text-foreground'
						: 'text-foreground hover:bg-surface-hover'}"
				>
					{#if item.state === 'OPEN'}
						<CircleDot size={14} class="shrink-0 text-gh-open" />
					{:else}
						<CircleCheck size={14} class="shrink-0 text-gh-closed" />
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
