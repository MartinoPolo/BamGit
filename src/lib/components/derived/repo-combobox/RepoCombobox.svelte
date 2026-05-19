<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { invoke } from '$lib/tauri.js';
	import { cn } from '$lib/utils.js';
	import type { GitHubRepo } from './repo_combobox_utils.js';
	import { repoFullName, filterRepos, sortReposWithRecent } from './repo_combobox_utils.js';
	import LockIcon from '@lucide/svelte/icons/lock';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { inputVariants } from '$lib/components/shadcn/input/index.js';

	interface Props {
		value: string;
		id?: string;
		placeholder?: string;
		recentRepoNames?: readonly string[];
		onchange?: () => void;
		portalProps?: Combobox.PortalProps;
	}

	let {
		value = $bindable(''),
		id,
		placeholder = 'owner/repo',
		recentRepoNames = [],
		onchange,
		portalProps,
	}: Props = $props();

	let userRepos = $state<GitHubRepo[]>([]);
	let searchResults = $state<GitHubRepo[]>([]);
	let searchValue = $state('');
	let open = $state(false);
	let loadingUserRepos = $state(false);
	let searchingRemote = $state(false);
	let searchDebounceTimer = $state<ReturnType<typeof setTimeout> | undefined>(undefined);
	let inputRef = $state<HTMLInputElement | null>(null);

	const localFiltered = $derived.by(() => {
		if (searchValue === '') {
			return sortReposWithRecent(userRepos.slice(0, 20), recentRepoNames);
		}
		const filtered = filterRepos(userRepos, searchValue);
		return sortReposWithRecent(filtered, recentRepoNames);
	});

	const displayedRepos = $derived.by(() => {
		if (searchResults.length > 0 && searchValue !== '') {
			return searchResults;
		}
		return localFiltered;
	});

	const recentSet = $derived(new Set(recentRepoNames.map((name) => name.toLowerCase())));

	async function loadUserRepos() {
		if (userRepos.length > 0 || loadingUserRepos) {
			return;
		}
		loadingUserRepos = true;
		try {
			userRepos = await invoke<GitHubRepo[]>('list_user_repos');
		} catch {
			userRepos = [];
		} finally {
			loadingUserRepos = false;
		}
	}

	function syncInputDisplay() {
		if (inputRef) {
			inputRef.value = value;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (isOpen) {
			void loadUserRepos();
		}
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		searchValue = target.value;
		searchResults = [];

		if (searchDebounceTimer !== undefined) {
			clearTimeout(searchDebounceTimer);
		}

		if (searchValue.length >= 2) {
			searchDebounceTimer = setTimeout(() => {
				void searchRemote(searchValue);
			}, 400);
		}
	}

	async function searchRemote(query: string) {
		if (localFiltered.length > 0) {
			return;
		}
		searchingRemote = true;
		try {
			searchResults = await invoke<GitHubRepo[]>('search_github_repos', { query });
		} catch {
			searchResults = [];
		} finally {
			searchingRemote = false;
		}
	}

	function handleOpenChangeComplete(isOpen: boolean) {
		if (!isOpen) {
			const typed = inputRef?.value.trim() ?? '';
			if (typed !== '' && value !== typed) {
				value = typed;
				onchange?.();
			}
			searchValue = '';
			searchResults = [];
			syncInputDisplay();
		}
	}

	$effect(() => {
		void value;
		if (!open) {
			syncInputDisplay();
		}
	});
</script>

<Combobox.Root
	type="single"
	bind:value
	{open}
	onOpenChange={handleOpenChange}
	onOpenChangeComplete={handleOpenChangeComplete}
	onValueChange={() => onchange?.()}
>
	<div class="relative">
		<Combobox.Input
			bind:ref={inputRef}
			{id}
			{placeholder}
			oninput={handleInput}
			class={cn(inputVariants(), 'pr-8')}
			aria-label="GitHub repository"
		/>
		<Combobox.Trigger class="absolute top-1/2 right-2 -translate-y-1/2 text-foreground-subtle">
			<ChevronsUpDownIcon size={14} />
		</Combobox.Trigger>
	</div>

	<Combobox.Portal {...portalProps}>
		<Combobox.Content
			class="z-(--z-tooltip) mt-1 max-h-60 w-(--bits-combobox-anchor-width) overflow-y-auto rounded-md border border-border bg-surface-3 shadow-md"
			sideOffset={4}
		>
			{#if loadingUserRepos || searchingRemote}
				<div class="px-3 py-2 text-xs text-foreground-subtle">Loading…</div>
			{/if}

			{#each displayedRepos as repo (repoFullName(repo))}
				<Combobox.Item
					value={repoFullName(repo)}
					label={repoFullName(repo)}
					class="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm data-highlighted:bg-surface-2"
				>
					{#snippet children({ selected })}
						{#if repo.is_private}
							<LockIcon size={12} class="shrink-0 text-foreground-subtle" />
						{:else}
							<GlobeIcon size={12} class="shrink-0 text-foreground-subtle" />
						{/if}
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="truncate font-medium">{repoFullName(repo)}</span>
								{#if recentSet.has(repoFullName(repo).toLowerCase())}
									<span
										class="shrink-0 rounded bg-primary/15 px-1 py-px text-[10px] font-medium text-primary"
										>Recent</span
									>
								{/if}
							</div>
							{#if repo.description}
								<div class="truncate text-xs text-foreground-subtle">
									{repo.description}
								</div>
							{/if}
						</div>
						{#if selected}
							<CheckIcon size={14} class="shrink-0 text-primary" />
						{/if}
					{/snippet}
				</Combobox.Item>
			{:else}
				{#if !loadingUserRepos && !searchingRemote}
					<div class="px-3 py-2 text-xs text-foreground-subtle">No repos found</div>
				{/if}
			{/each}
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
