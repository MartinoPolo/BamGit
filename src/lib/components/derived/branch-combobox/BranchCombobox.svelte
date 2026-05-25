<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { invoke } from '$lib/tauri.js';
	import { cn } from '$lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { inputVariants } from '$lib/components/shadcn/input/index.js';

	interface RepoBranch {
		name: string;
	}

	interface Props {
		value: string;
		githubRepo: string;
		id?: string;
		placeholder?: string;
		disabled?: boolean;
		portalProps?: Combobox.PortalProps;
	}

	let {
		value = $bindable(''),
		githubRepo,
		id,
		placeholder = 'main',
		disabled = false,
		portalProps,
	}: Props = $props();

	let branches = $state<RepoBranch[]>([]);
	let open = $state(false);
	let loading = $state(false);
	let lastFetchedRepo = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);
	let searchValue = $state('');

	const filteredBranches = $derived.by(() => {
		if (searchValue === '') {
			return branches;
		}
		const lower = searchValue.toLowerCase();
		return branches.filter((b) => b.name.toLowerCase().includes(lower));
	});

	async function fetchBranches(repo: string) {
		if (!repo || loading) {
			return;
		}
		const parts = repo.split('/');
		if (parts.length !== 2) {
			return;
		}
		loading = true;
		try {
			branches = await invoke<RepoBranch[]>('list_repo_branches', {
				owner: parts[0],
				repo: parts[1],
			});
			lastFetchedRepo = repo;
		} catch {
			branches = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (githubRepo && githubRepo !== lastFetchedRepo) {
			value = '';
			branches = [];
			void fetchBranches(githubRepo);
		}
		if (!githubRepo) {
			branches = [];
			lastFetchedRepo = '';
		}
	});

	function syncInputDisplay() {
		if (inputRef) {
			inputRef.value = value;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (isOpen && githubRepo && branches.length === 0 && !loading) {
			void fetchBranches(githubRepo);
		}
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		searchValue = target.value;
	}

	function handleOpenChangeComplete(isOpen: boolean) {
		if (!isOpen) {
			const typed = inputRef?.value.trim() ?? '';
			if (typed !== '' && value !== typed) {
				value = typed;
			}
			searchValue = '';
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
	{disabled}
	onOpenChange={handleOpenChange}
	onOpenChangeComplete={handleOpenChangeComplete}
>
	<div class="relative">
		<Combobox.Input
			bind:ref={inputRef}
			{id}
			{placeholder}
			{disabled}
			oninput={handleInput}
			onfocus={() => {
				if (!disabled) {
					handleOpenChange(true);
				}
			}}
			onclick={() => {
				if (!disabled) {
					handleOpenChange(true);
				}
			}}
			class={cn(inputVariants(), 'pr-8', disabled && 'cursor-not-allowed opacity-50')}
			aria-label="Base branch"
		/>
		<Combobox.Trigger
			class="absolute top-1/2 right-2 -translate-y-1/2 text-foreground-subtle"
			{disabled}
		>
			<ChevronsUpDownIcon size={14} />
		</Combobox.Trigger>
	</div>

	<Combobox.Portal {...portalProps}>
		<Combobox.Content
			class="z-(--z-tooltip) mt-1 max-h-60 w-(--bits-combobox-anchor-width) overflow-y-auto rounded-md border border-border bg-surface p-1.5 shadow-md"
			sideOffset={4}
		>
			{#if loading}
				<div class="px-2 py-1.5 text-xs text-foreground-subtle">Loading…</div>
			{/if}

			{#each filteredBranches as branch (branch.name)}
				<Combobox.Item
					value={branch.name}
					label={branch.name}
					class="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-surface-2"
				>
					{#snippet children({ selected })}
						<span class="truncate">{branch.name}</span>
						{#if selected}
							<CheckIcon size={14} class="shrink-0 text-primary" />
						{/if}
					{/snippet}
				</Combobox.Item>
			{:else}
				{#if !loading}
					<div class="px-2 py-1.5 text-xs text-foreground-subtle">No branches found</div>
				{/if}
			{/each}
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
