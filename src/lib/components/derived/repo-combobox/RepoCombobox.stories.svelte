<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RepoCombobox from './RepoCombobox.svelte';

	const { Story } = defineMeta({
		title: 'Derived/RepoCombobox',
		component: RepoCombobox,
		tags: ['autodocs'],
		argTypes: {
			placeholder: { control: 'text' },
		},
	});
</script>

<script lang="ts">
	let defaultValue = $state('');
	let preselectedValue = $state('MartinoPolo/grovekeeper');
	let recentValue = $state('');
	let loadingValue = $state('');
	let remoteSearchValue = $state('');

	const RECENT_REPOS = ['MartinoPolo/grovekeeper', 'MartinoPolo/low-poly-2d-trees'];
</script>

<!-- Empty initial state. Open the dropdown — repos load from mock (list_user_repos). -->
<Story name="Default">
	{#snippet template()}
		<div class="w-80">
			<RepoCombobox bind:value={defaultValue} />
		</div>
	{/snippet}
</Story>

<!-- Repos list: same component, showing all repos appear on open (mock resolves immediately). -->
<Story name="With Repos List">
	{#snippet template()}
		<div class="w-80 pb-64">
			<RepoCombobox bind:value={loadingValue} placeholder="owner/repo" />
			<p class="mt-2 text-xs text-foreground-subtle">Open the dropdown to see repos.</p>
		</div>
	{/snippet}
</Story>

<!-- Preselected value: the input shows an already-chosen repo. -->
<Story name="Preselected Value">
	{#snippet template()}
		<div class="w-80">
			<RepoCombobox bind:value={preselectedValue} />
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
			<RepoCombobox bind:value={loadingValue} />
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
			<RepoCombobox bind:value={recentValue} recentRepoNames={RECENT_REPOS} />
			<p class="mt-2 text-xs text-foreground-subtle">
				Open dropdown — two repos appear at the top with a "Recent" badge.
			</p>
		</div>
	{/snippet}
</Story>
