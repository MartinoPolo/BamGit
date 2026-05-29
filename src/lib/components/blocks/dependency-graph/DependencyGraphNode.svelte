<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import { SPECIAL_LABELS } from '$lib/modules/visualization';
	import {
		READY_STATE,
		DESIGN_NEEDED_LABEL,
		isClosedIssue,
		type ReadyState,
	} from '$lib/modules/dependency-graph';
	import PlayIcon from '@lucide/svelte/icons/play';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LayersIcon from '@lucide/svelte/icons/layers';

	interface Props {
		issue: Issue;
		readyState: ReadyState;
		isPrd: boolean;
		subIssueProgress?: { completed: number; total: number };
		selected: boolean;
		onselect: (issueId: string) => void;
		onhitlquickstart?: (issueId: string) => void;
	}

	let {
		issue,
		readyState,
		isPrd,
		subIssueProgress,
		selected,
		onselect,
		onhitlquickstart,
	}: Props = $props();

	const hasHitlLabel = $derived(issue.labels.some((label) => label.name === SPECIAL_LABELS.hitl));
	const hasAfkLabel = $derived(issue.labels.some((label) => label.name === SPECIAL_LABELS.afk));
	const hasDesignNeeded = $derived(
		issue.labels.some((label) => label.name === DESIGN_NEEDED_LABEL),
	);
	const closed = $derived(isClosedIssue(issue));

	const areaLabels = $derived(issue.labels.filter((label) => label.name.startsWith('area:')));

	const issueNumberDisplay = $derived(
		issue.github_issue_number !== null ? `#${issue.github_issue_number}` : '',
	);

	function handleClick() {
		onselect(issue.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onselect(issue.id);
		}
	}
</script>

<div
	class="dep-node"
	class:selected
	class:closed
	class:is-prd={isPrd}
	data-ready={readyState}
	data-dep-node="true"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeydown}
	aria-label={isPrd ? `PRD: ${issue.name}` : `Issue: ${issue.name}`}
>
	<div class="dep-node-header">
		{#if isPrd}
			<span class="dep-node-prd-icon-wrap" aria-hidden="true">
				<LayersIcon size={11} />
			</span>
		{/if}
		<span class="dep-node-number">
			{isPrd ? 'PRD' : ''}
			{issueNumberDisplay}
		</span>
		{#if readyState !== READY_STATE.none}
			<span class="dep-node-ready-dot" data-ready={readyState} aria-hidden="true"></span>
		{/if}
		{#if closed}
			<span class="dep-node-check-wrap" aria-hidden="true">
				<CheckIcon size={12} />
			</span>
		{/if}
	</div>

	<div class="dep-node-title" title={issue.name}>{issue.name}</div>

	<div class="dep-node-pills">
		{#if hasAfkLabel}
			<span class="pill pill-afk">AFK</span>
		{/if}
		{#if hasHitlLabel}
			<span class="pill pill-hitl">HITL</span>
		{/if}
		{#if hasDesignNeeded}
			<span class="pill pill-design">design</span>
		{/if}
		{#each areaLabels.slice(0, 2) as label (label.name)}
			<span class="pill pill-area">{label.name.replace('area:', '')}</span>
		{/each}
		{#if isPrd && subIssueProgress !== undefined}
			<span class="pill pill-progress">
				{subIssueProgress.completed}/{subIssueProgress.total}
			</span>
		{/if}
	</div>

	{#if hasHitlLabel && !closed && onhitlquickstart}
		<button
			type="button"
			class="hitl-quick-start"
			onclick={(event) => {
				event.stopPropagation();
				onhitlquickstart?.(issue.id);
			}}
			aria-label="Quick start HITL session for {issue.name}"
		>
			<PlayIcon size={11} />
		</button>
	{/if}
</div>

<style>
	.dep-node {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
		height: 100%;
		padding: 8px 10px;
		border: 1.5px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		cursor: pointer;
		transition:
			border-color var(--transition-duration-3) ease,
			box-shadow var(--transition-duration-3) ease,
			transform var(--transition-duration-3) ease;
		text-align: left;
		box-sizing: border-box;
	}

	.dep-node:hover {
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.dep-node.selected {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px var(--primary);
	}

	.dep-node.closed {
		opacity: 0.55;
		filter: grayscale(0.4);
	}

	.dep-node.is-prd {
		background: color-mix(in oklch, var(--primary) 8%, var(--card));
		border-color: color-mix(in oklch, var(--primary) 40%, var(--border));
	}

	.dep-node[data-ready='ready-to-execute']:not(.closed) {
		box-shadow: 0 0 0 2px oklch(0.7 0.18 142);
	}

	.dep-node[data-ready='ready-to-grill']:not(.closed) {
		box-shadow: 0 0 0 2px oklch(0.78 0.16 85);
	}

	.dep-node[data-ready='needs-design']:not(.closed) {
		box-shadow: 0 0 0 2px oklch(0.7 0.18 40);
	}

	.dep-node-header {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		font-weight: 600;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.dep-node-number {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dep-node-ready-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.dep-node-ready-dot[data-ready='ready-to-execute'] {
		background: oklch(0.65 0.2 142);
	}

	.dep-node-ready-dot[data-ready='ready-to-grill'] {
		background: oklch(0.75 0.16 85);
	}

	.dep-node-ready-dot[data-ready='needs-design'] {
		background: oklch(0.7 0.18 40);
	}

	.dep-node-title {
		font-size: 12px;
		font-weight: 500;
		color: var(--foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.dep-node-pills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 3px;
		min-height: 16px;
	}

	.pill {
		font-size: 9px;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 4px;
		line-height: 1.4;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.pill-afk {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.pill-hitl {
		background: oklch(0.8 0.15 85);
		color: oklch(0.25 0.05 85);
	}

	.pill-design {
		background: oklch(0.78 0.16 40);
		color: oklch(0.22 0.05 40);
	}

	.pill-area {
		background: color-mix(in oklch, var(--muted) 80%, transparent);
		color: var(--muted-foreground);
		text-transform: lowercase;
		font-weight: 500;
	}

	.pill-progress {
		background: color-mix(in oklch, var(--primary) 20%, var(--card));
		color: var(--foreground);
		font-weight: 600;
		text-transform: none;
	}

	.hitl-quick-start {
		position: absolute;
		bottom: 6px;
		right: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: none;
		background: var(--primary);
		color: var(--primary-foreground);
		cursor: pointer;
		transition: opacity var(--transition-duration-3) ease;
	}

	.hitl-quick-start:hover {
		opacity: 0.85;
	}

	.dep-node-prd-icon-wrap {
		color: var(--primary);
		display: inline-flex;
	}

	.dep-node-check-wrap {
		color: oklch(0.65 0.2 142);
		display: inline-flex;
	}
</style>
