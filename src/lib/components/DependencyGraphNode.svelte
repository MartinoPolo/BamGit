<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import { LowPolyTree, PottedPlant, DEFAULT_TREE_CONFIG } from 'low-poly-2d-trees';
	import type { TreeConfig } from 'low-poly-2d-trees';
	import PlayIcon from '@lucide/svelte/icons/play';

	interface Props {
		issue: Issue;
		visualization: TreeVisualization | undefined;
		selected: boolean;
		onselect: (issueId: string) => void;
		onhitlquickstart?: (issueId: string) => void;
	}

	let { issue, visualization, selected, onselect, onhitlquickstart }: Props = $props();

	const hasHitlLabel = $derived(issue.labels.some((label) => label.name === 'HITL'));
	const hasAfkLabel = $derived(issue.labels.some((label) => label.name === 'AFK'));

	const oakConfig: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		shape: 'oak',
		stage: 'fruiting',
	};
</script>

<div
	class="dependency-node"
	class:selected
	role="button"
	tabindex="0"
	onclick={() => onselect(issue.id)}
	onkeydown={(event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			onselect(issue.id);
		}
	}}
	aria-label="Issue: {issue.name}"
>
	<div class="node-thumbnail">
		{#if visualization?.kind === 'tree'}
			<LowPolyTree config={visualization.config} />
		{:else if visualization?.kind === 'potted-plant'}
			<PottedPlant stage={visualization.stage} seed={visualization.seed} />
		{:else if visualization?.kind === 'oak'}
			<LowPolyTree config={oakConfig} />
		{:else}
			<LowPolyTree config={DEFAULT_TREE_CONFIG} />
		{/if}
	</div>

	<div class="node-content">
		<span class="node-title" title={issue.name}>{issue.name}</span>
		<div class="node-badges">
			{#if hasAfkLabel}
				<span class="badge badge-afk">AFK</span>
			{/if}
			{#if hasHitlLabel}
				<span class="badge badge-hitl">HITL</span>
				{#if onhitlquickstart}
					<button
						class="hitl-quick-start"
						onclick={(event: MouseEvent) => {
							event.stopPropagation();
							onhitlquickstart?.(issue.id);
						}}
						aria-label="Quick start HITL session for {issue.name}"
					>
						<PlayIcon size={12} />
					</button>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.dependency-node {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		height: 100%;
		padding: 8px;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		cursor: pointer;
		transition: all 150ms ease;
		text-align: left;
	}

	.dependency-node:hover {
		border-color: var(--primary);
		background: var(--accent);
	}

	.dependency-node.selected {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);
	}

	.node-thumbnail {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.node-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.node-title {
		font-size: 12px;
		font-weight: 500;
		color: var(--foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.node-badges {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.badge {
		font-size: 10px;
		font-weight: 600;
		padding: 1px 5px;
		border-radius: 4px;
		line-height: 1.4;
	}

	.badge-afk {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.badge-hitl {
		background: oklch(0.8 0.15 85);
		color: oklch(0.25 0.05 85);
	}

	.hitl-quick-start {
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
		transition: background 150ms ease;
	}

	.hitl-quick-start:hover {
		background: var(--primary);
		opacity: 0.8;
	}
</style>
