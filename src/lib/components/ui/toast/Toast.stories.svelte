<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Toast, TOAST_TONE_OPTIONS } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
	import CheckIcon from '@lucide/svelte/icons/check';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/x';

	const { Story } = defineMeta({
		title: 'UI/Toast',
		component: Toast,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			tone: {
				control: 'select',
				options: [...TOAST_TONE_OPTIONS],
			},
			title: { control: 'text' },
			body: { control: 'text' },
		},
	});
</script>

<Story name="Info">
	{#snippet template()}
		<div class="max-w-[540px]">
			<Toast
				tone="info"
				title="Syncing grovekeeper…"
				body="Fetching 3 new commits from origin."
			>
				{#snippet icon()}<RefreshIcon class="size-3.5" />{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>

<Story name="Success">
	{#snippet template()}
		<div class="max-w-[540px]">
			<Toast
				tone="success"
				title="Worktree created"
				body="Branch feat/forest-overlays checked out."
			>
				{#snippet icon()}<CheckIcon class="size-3.5" />{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>

<Story name="Warning">
	{#snippet template()}
		<div class="max-w-[540px]">
			<Toast
				tone="warning"
				title="Permission required"
				body="Session #128 wants to run a Bash command."
			>
				{#snippet icon()}<AlertTriangleIcon class="size-3.5" />{/snippet}
				{#snippet action()}
					<button
						class="inline-flex h-[var(--size-control-sm)] items-center rounded-[var(--radius-sm)] border border-border bg-surface-2 px-[9px] text-[length:var(--text-sm)] text-foreground hover:bg-surface-3"
					>
						Review
					</button>
				{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>

<Story name="Danger">
	{#snippet template()}
		<div class="max-w-[540px]">
			<Toast
				tone="danger"
				title="Sync failed"
				body="GitHub returned 401 — check token in Settings."
			>
				{#snippet icon()}<XIcon class="size-3.5" />{/snippet}
				{#snippet action()}
					<button
						class="inline-flex h-[var(--size-control-sm)] items-center rounded-[var(--radius-sm)] border border-border bg-surface-2 px-[9px] text-[length:var(--text-sm)] text-foreground hover:bg-surface-3"
					>
						Retry
					</button>
				{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="max-w-[540px]">
			<Toast tone="loading" title="Planting tree…" body="Setting up worktree for #142">
				{#snippet icon()}<RefreshIcon class="size-3.5 animate-spin" />{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>

<Story name="Stack">
	{#snippet template()}
		<div class="flex max-w-[540px] flex-col gap-3">
			<Toast
				tone="info"
				title="Syncing grovekeeper…"
				body="Fetching 3 new commits from origin."
			>
				{#snippet icon()}<RefreshIcon class="size-3.5" />{/snippet}
			</Toast>
			<Toast
				tone="success"
				title="Worktree created"
				body="Branch feat/forest-overlays checked out."
			>
				{#snippet icon()}<CheckIcon class="size-3.5" />{/snippet}
			</Toast>
			<Toast
				tone="warning"
				title="Permission required"
				body="Session #128 wants to run a Bash command."
			>
				{#snippet icon()}<AlertTriangleIcon class="size-3.5" />{/snippet}
				{#snippet action()}
					<button
						class="inline-flex h-[var(--size-control-sm)] items-center rounded-[var(--radius-sm)] border border-border bg-surface-2 px-[9px] text-[length:var(--text-sm)] text-foreground hover:bg-surface-3"
					>
						Review
					</button>
				{/snippet}
			</Toast>
			<Toast
				tone="danger"
				title="Sync failed"
				body="GitHub returned 401 — check token in Settings."
			>
				{#snippet icon()}<XIcon class="size-3.5" />{/snippet}
				{#snippet action()}
					<button
						class="inline-flex h-[var(--size-control-sm)] items-center rounded-[var(--radius-sm)] border border-border bg-surface-2 px-[9px] text-[length:var(--text-sm)] text-foreground hover:bg-surface-3"
					>
						Retry
					</button>
				{/snippet}
			</Toast>
			<Toast tone="loading" title="Planting tree…" body="Setting up worktree for #142">
				{#snippet icon()}<RefreshIcon class="size-3.5 animate-spin" />{/snippet}
			</Toast>
		</div>
	{/snippet}
</Story>
