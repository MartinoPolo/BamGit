<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SessionStateBadge from './SessionStateBadge.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Session/Components',
		component: SessionStateBadge,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';
	import ProviderChip from './ProviderChip.svelte';
	import type { SessionState } from '$lib/types/generated/SessionState.js';

	const allStates: SessionState[] = [
		'running',
		'needs-input',
		'needs-review',
		'paused',
		'finished',
		'errored',
	];

	const providers = ['claude-code', 'open-code', 'codex', 'cursor'];
</script>

<Story name="Session State Badges">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3 p-4">
			{#each allStates as state}
				<SessionStateBadge {state} />
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Progress Bars">
	{#snippet template()}
		<div class="flex w-64 flex-col gap-4 p-4">
			<div>
				<div class="mb-1 text-xs text-foreground-subtle">10% — Green</div>
				<ProgressBar percent={10} color="var(--status-success)" />
			</div>
			<div>
				<div class="mb-1 text-xs text-foreground-subtle">50% — Orange (context)</div>
				<ProgressBar percent={50} color="var(--status-warning)" />
			</div>
			<div>
				<div class="mb-1 text-xs text-foreground-subtle">80% — Red (context)</div>
				<ProgressBar percent={80} color="var(--status-danger)" />
			</div>
			<div>
				<div class="mb-1 text-xs text-foreground-subtle">Custom height (8px)</div>
				<ProgressBar percent={65} height={8} color="var(--primary)" />
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Provider Chips">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3 p-4">
			{#each providers as provider}
				<ProviderChip {provider} />
			{/each}
			<ProviderChip provider="unknown-provider" />
		</div>
	{/snippet}
</Story>
