<script lang="ts">
	import { onMount } from 'svelte';
	import { get_dashboards, create_dashboard } from '$lib/tauri/commands';
	import type { Dashboard } from '$lib/types/dashboard';

	let dashboards = $state<Dashboard[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load_dashboards() {
		try {
			dashboards = await get_dashboards();
			error = null;
		} catch (err) {
			error = String(err);
		} finally {
			loading = false;
		}
	}

	async function handle_create_test_dashboard() {
		try {
			await create_dashboard({
				name: `Test Dashboard ${dashboards.length + 1}`,
				type: 'repo',
			});
			await load_dashboards();
		} catch (err) {
			error = String(err);
		}
	}

	onMount(load_dashboards);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold">Issue Dashboard</h1>
		<button
			onclick={handle_create_test_dashboard}
			class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-500"
		>
			Create Test Dashboard
		</button>
	</div>

	{#if loading}
		<p class="text-neutral-500">Loading dashboards...</p>
	{:else if error}
		<p class="text-red-400">Error: {error}</p>
	{:else if dashboards.length === 0}
		<p class="text-neutral-500">No dashboards yet. Create one to test the IPC bridge.</p>
	{:else}
		<div class="space-y-2">
			{#each dashboards as dashboard (dashboard.id)}
				<div class="rounded border border-neutral-800 bg-neutral-900 p-3">
					<div class="flex items-center gap-2">
						<span class="font-medium">{dashboard.name}</span>
						<span class="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
							{dashboard.type}
						</span>
					</div>
					{#if dashboard.github_repo}
						<p class="mt-1 text-sm text-neutral-500">{dashboard.github_repo}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
