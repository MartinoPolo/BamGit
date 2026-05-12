<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RefreshIndicator from './RefreshIndicator.svelte';
	import { REFRESH_STATES } from '$lib/modules/usage/usage_types.js';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/RefreshIndicator',
		component: RefreshIndicator,
		tags: ['autodocs'],
	});
</script>

<Story name="Idle">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<RefreshIndicator
				refreshState={REFRESH_STATES.idle}
				lastUpdatedAt={null}
				onrefresh={() => console.log('refresh')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<RefreshIndicator
				refreshState={REFRESH_STATES.loading}
				lastUpdatedAt={null}
				onrefresh={() => console.log('refresh')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Fresh">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<RefreshIndicator
				refreshState={REFRESH_STATES.fresh}
				lastUpdatedAt={Date.now()}
				onrefresh={() => console.log('refresh')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Stale">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<RefreshIndicator
				refreshState={REFRESH_STATES.stale}
				lastUpdatedAt={Date.now() - 5 * 60_000}
				onrefresh={() => console.log('refresh')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="New Data Available">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<RefreshIndicator
				refreshState={REFRESH_STATES.newDataAvailable}
				lastUpdatedAt={Date.now() - 2 * 60_000}
				onrefresh={() => console.log('refresh')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template()}
		<div class="flex flex-col gap-4 p-8">
			{#each [{ state: REFRESH_STATES.idle, label: 'Idle', ts: null }, { state: REFRESH_STATES.loading, label: 'Loading', ts: null }, { state: REFRESH_STATES.fresh, label: 'Fresh (hover for tooltip)', ts: Date.now() }, { state: REFRESH_STATES.stale, label: 'Stale — 5m ago (hover for tooltip)', ts: Date.now() - 5 * 60_000 }, { state: REFRESH_STATES.newDataAvailable, label: 'New data available (dot badge)', ts: Date.now() - 2 * 60_000 }] as item (item.state)}
				<div class="flex items-center gap-3">
					<RefreshIndicator
						refreshState={item.state}
						lastUpdatedAt={item.ts}
						onrefresh={() => console.log('refresh', item.state)}
					/>
					<span class="text-sm text-muted-foreground">{item.label}</span>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
