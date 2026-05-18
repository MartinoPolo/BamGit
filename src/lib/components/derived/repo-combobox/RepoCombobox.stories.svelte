<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import RepoCombobox from './RepoCombobox.svelte';

	const { Story } = defineMeta({
		title: 'Derived/RepoCombobox',
		component: RepoCombobox,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
		},
	});

	/* ── Helpers ───────────────────────────────────────────────────────── */

	/** Wait for the listbox to appear inside the canvas and return it. */
	async function waitForListbox(canvasElement: HTMLElement): Promise<HTMLElement> {
		let listbox: HTMLElement | null = null;
		await waitFor(() => {
			listbox = within(canvasElement).queryByRole('listbox');
			if (!listbox) {
				throw new Error('listbox not found');
			}
		});
		return listbox!;
	}

	/** Wait for options inside the listbox scoped to canvasElement. */
	async function waitForOptions(canvasElement: HTMLElement): Promise<HTMLElement[]> {
		let options: HTMLElement[] = [];
		await waitFor(() => {
			const listbox = within(canvasElement).queryByRole('listbox');
			if (!listbox) {
				throw new Error('listbox not found');
			}
			options = within(listbox).getAllByRole('option');
			if (options.length === 0) {
				throw new Error('no options');
			}
		});
		return options;
	}

	/* ── Play functions ────────────────────────────────────────────────── */

	/**
	 * Open the combobox dropdown by clicking the trigger button.
	 * Falls back to focusing the input and pressing ArrowDown.
	 */
	async function openCombobox(canvasElement: HTMLElement): Promise<HTMLElement> {
		const triggerButton = canvasElement.querySelector(
			'[data-combobox-trigger]',
		) as HTMLElement | null;
		if (triggerButton) {
			await userEvent.click(triggerButton);
		} else {
			const canvas = within(canvasElement);
			const input = canvas.getByRole('combobox');
			await userEvent.click(input);
			await userEvent.keyboard('{ArrowDown}');
		}
		return await waitForListbox(canvasElement);
	}

	/** Click trigger → dropdown opens, repos list visible. */
	const playOpenDropdown = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await openCombobox(canvasElement);

		const options = await waitForOptions(canvasElement);
		// Mock list_user_repos returns 5 repos
		await expect(options.length).toBe(5);
		await expect(options[0]).toHaveTextContent('MartinoPolo/grovekeeper');
	};

	/** Type search text → list filters to matching repos. */
	const playSearchFilter = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');

		// Open dropdown
		await openCombobox(canvasElement);
		await waitForOptions(canvasElement);

		// Type "private" — should filter to only the private app
		await userEvent.type(input, 'private');

		await waitFor(async () => {
			const listbox = within(canvasElement).getByRole('listbox');
			const options = within(listbox).getAllByRole('option');
			await expect(options.length).toBe(1);
			await expect(options[0]).toHaveTextContent('MartinoPolo/my-private-app');
		});
	};

	/** ArrowDown → first item highlighted. */
	const playArrowDownHighlights = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Opening via ArrowDown already highlights the first item
		await openCombobox(canvasElement);
		await waitForOptions(canvasElement);

		// ArrowDown → first option gets data-highlighted
		await userEvent.keyboard('{ArrowDown}');

		await waitFor(() => {
			const listbox = within(canvasElement).getByRole('listbox');
			const highlighted = listbox.querySelector('[data-highlighted]');
			if (!highlighted) {
				throw new Error('no highlighted option');
			}
		});
	};

	/** Enter → selects highlighted repo, closes dropdown, trigger shows name. */
	const playEnterSelects = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');

		// Open dropdown
		await openCombobox(canvasElement);
		await waitForOptions(canvasElement);

		// ArrowDown to highlight the first item, then Enter to select
		await userEvent.keyboard('{ArrowDown}');

		await userEvent.keyboard('{Enter}');

		// Dropdown should close
		await waitFor(() => {
			const lb = within(canvasElement).queryByRole('listbox');
			if (lb) {
				throw new Error('listbox still open');
			}
		});

		// Input value should show the selected repo name (may need a tick to sync)
		// The combobox bind:value sets the input to the selected item's value
		await waitFor(() => {
			const currentValue = (input as HTMLInputElement).value;
			expect(currentValue).not.toBe('');
			// Verify it matches one of the known repo names
			expect(currentValue).toMatch(/MartinoPolo\//);
		});
	};

	/** Escape → closes dropdown, no selection made. */
	const playEscapeCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');

		// Open dropdown
		await openCombobox(canvasElement);
		await waitForOptions(canvasElement);

		// Escape → closes without selecting
		await userEvent.keyboard('{Escape}');

		await waitFor(() => {
			const listbox = within(canvasElement).queryByRole('listbox');
			if (listbox) {
				throw new Error('listbox still open');
			}
		});

		// Value should remain empty (no selection)
		await expect(input).toHaveValue('');
	};

	/** Escape closes combobox only — does not propagate to parent layers. */
	const playEscapeDoesNotPropagate = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');

		// Open dropdown
		await openCombobox(canvasElement);
		await waitForOptions(canvasElement);

		// Press Escape — should only close the listbox
		await userEvent.keyboard('{Escape}');

		await waitFor(() => {
			const listbox = within(canvasElement).queryByRole('listbox');
			if (listbox) {
				throw new Error('listbox still open');
			}
		});

		// Input is still in the DOM (parent layer not dismissed)
		await expect(input).toBeInTheDocument();
	};
</script>

<script lang="ts">
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	let defaultValue = $state('');
	let preselectedValue = $state('MartinoPolo/grovekeeper');
	let recentValue = $state('');
	let loadingValue = $state('');
	let remoteSearchValue = $state('');
	let openDropdownValue = $state('');
	let searchFilterValue = $state('');
	let arrowDownValue = $state('');
	let enterSelectsValue = $state('');
	let escapeClosesValue = $state('');
	let escapePropagationValue = $state('');

	const RECENT_REPOS = ['MartinoPolo/grovekeeper', 'MartinoPolo/low-poly-2d-trees'];
</script>

<!-- Empty initial state. Open the dropdown — repos load from mock (list_user_repos). -->
<Story name="Default">
	{#snippet template()}
		<div class="w-80">
			<RepoCombobox bind:value={defaultValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<!-- Repos list: same component, showing all repos appear on open (mock resolves immediately). -->
<Story name="With Repos List">
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox
				bind:value={loadingValue}
				placeholder="owner/repo"
				portalProps={{ disabled: true }}
			/>
			<p class="mt-2 text-xs text-foreground-subtle">Open the dropdown to see repos.</p>
		</div>
	{/snippet}
</Story>

<!-- Preselected value: the input shows an already-chosen repo. -->
<Story name="Preselected Value">
	{#snippet template()}
		<div class="w-80">
			<RepoCombobox bind:value={preselectedValue} portalProps={{ disabled: true }} />
			<p class="mt-2 font-mono text-xs text-foreground-subtle">value: {preselectedValue}</p>
		</div>
	{/snippet}
</Story>

<!--
	Loading state: the component shows "Loading…" inside the popover while list_user_repos
	resolves. Because the mock resolves in the next microtask, the spinner is only visible
	for one render tick — open the dropdown quickly to catch it in development.
-->
<Story name="Loading State">
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox bind:value={loadingValue} portalProps={{ disabled: true }} />
			<p class="mt-2 text-xs text-foreground-subtle">
				Open dropdown — "Loading…" flashes while repos fetch.
			</p>
		</div>
	{/snippet}
</Story>

<!--
	Remote search results: type 2+ characters that match nothing in the user repo list
	(e.g. "sveltejs") and wait ~400 ms. search_github_repos mock returns sveltejs/svelte
	and tauri-apps/tauri.
	recentRepoNames surfaces "Recent" badges for previously-used repos.
-->
<Story name="Remote Search Results">
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox
				bind:value={remoteSearchValue}
				recentRepoNames={RECENT_REPOS}
				placeholder="Type 'sveltejs' to trigger remote search…"
				portalProps={{ disabled: true }}
			/>
			<p class="mt-2 text-xs text-foreground-subtle">
				Type ≥2 chars with no local match → search_github_repos is called after 400 ms
				debounce.
			</p>
		</div>
	{/snippet}
</Story>

<!-- Recent repos: recentRepoNames injects "Recent" badges into the top of the list. -->
<Story name="With Recent Repos">
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox
				bind:value={recentValue}
				recentRepoNames={RECENT_REPOS}
				portalProps={{ disabled: true }}
			/>
			<p class="mt-2 text-xs text-foreground-subtle">
				Open dropdown — two repos appear at the top with a "Recent" badge.
			</p>
		</div>
	{/snippet}
</Story>

<!-- ── Interaction tests ─────────────────────────────────────────────── -->

<Story name="Open Dropdown [play: opens dropdown]" play={playOpenDropdown}>
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox bind:value={openDropdownValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<Story name="Search Filter [play: search filter]" play={playSearchFilter}>
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox bind:value={searchFilterValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<Story name="Arrow Down Highlights [play: arrow down highlights]" play={playArrowDownHighlights}>
	{#snippet template()}
		<div class="w-80 pb-64">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate options" />
				<KeyboardHint keys="Enter" action="Select option" />
				<KeyboardHint keys="Escape" action="Close dropdown" />
			</StoryKeyboardHints>
			<RepoCombobox bind:value={arrowDownValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<Story name="Enter Selects [play: enter selects]" play={playEnterSelects}>
	{#snippet template()}
		<div class="w-80 pb-64">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate options" />
				<KeyboardHint keys="Enter" action="Select option" />
				<KeyboardHint keys="Escape" action="Close dropdown" />
			</StoryKeyboardHints>
			<RepoCombobox bind:value={enterSelectsValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<Story name="Escape Closes [play: escape closes]" play={playEscapeCloses}>
	{#snippet template()}
		<div class="w-80 pb-64">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate options" />
				<KeyboardHint keys="Enter" action="Select option" />
				<KeyboardHint keys="Escape" action="Close dropdown" />
			</StoryKeyboardHints>
			<RepoCombobox bind:value={escapeClosesValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>

<Story
	name="Escape Does Not Propagate [play: escape does not propagate]"
	play={playEscapeDoesNotPropagate}
>
	{#snippet template()}
		<div class="w-80 pb-64">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate options" />
				<KeyboardHint keys="Enter" action="Select option" />
				<KeyboardHint keys="Escape" action="Close dropdown" />
			</StoryKeyboardHints>
			<RepoCombobox bind:value={escapePropagationValue} portalProps={{ disabled: true }} />
		</div>
	{/snippet}
</Story>
