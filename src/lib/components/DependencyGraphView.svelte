<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { IssueDependency } from '$lib/types/generated';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import {
		computeDependencyLayout,
		NODE_WIDTH,
		NODE_HEIGHT,
	} from '$lib/modules/dependency-graph';
	import { useSelection } from '$lib/modules/board';
	import DependencyGraphNode from './DependencyGraphNode.svelte';
	import NetworkOffIcon from '@lucide/svelte/icons/network';

	interface Props {
		issues: readonly Issue[];
		dependencies: readonly IssueDependency[];
		getVisualization: (issueId: string) => TreeVisualization | undefined;
		onhitlquickstart?: (issueId: string) => void;
	}

	let { issues, dependencies, getVisualization, onhitlquickstart }: Props = $props();

	const selection = useSelection();

	const PADDING = 40;

	const layout = $derived.by(() => {
		const mutableIssues = issues.map((issue) => ({ id: issue.id, name: issue.name }));
		const mutableDeps = [...dependencies];
		return computeDependencyLayout(mutableIssues, mutableDeps);
	});

	const issueMap = $derived(new Map(issues.map((issue) => [issue.id, issue])));

	const viewBox = $derived(
		layout.graphWidth > 0
			? `${-PADDING} ${-PADDING} ${layout.graphWidth + PADDING * 2} ${layout.graphHeight + PADDING * 2}`
			: '0 0 100 100',
	);

	function buildEdgePath(points: Array<{ x: number; y: number }>): string {
		if (points.length === 0) {
			return '';
		}
		const [first, ...rest] = points;
		let path = `M ${first.x} ${first.y}`;
		for (const point of rest) {
			path += ` L ${point.x} ${point.y}`;
		}
		return path;
	}

	function handleNodeSelect(issueId: string) {
		selection.selectIssue(issueId);
	}
</script>

{#if layout.nodes.length === 0}
	<div class="flex h-full flex-col items-center justify-center gap-3 p-8">
		<NetworkOffIcon size={32} class="text-muted-foreground/50" />
		<p class="text-sm text-muted-foreground">No blocking relationships defined</p>
	</div>
{:else}
	<div class="dependency-graph-container">
		<svg class="dependency-graph-svg" {viewBox} preserveAspectRatio="xMidYMid meet">
			<defs>
				<marker
					id="arrowhead"
					markerWidth="8"
					markerHeight="6"
					refX="8"
					refY="3"
					orient="auto"
					markerUnits="strokeWidth"
				>
					<path d="M 0 0 L 8 3 L 0 6 Z" fill="var(--muted-foreground)" opacity="0.6" />
				</marker>
			</defs>

			{#each layout.edges as edge (edge.fromId + '-' + edge.toId)}
				<path
					d={buildEdgePath(edge.points)}
					fill="none"
					stroke="var(--muted-foreground)"
					stroke-width="1.5"
					stroke-opacity="0.4"
					marker-end="url(#arrowhead)"
				/>
			{/each}

			{#each layout.nodes as node (node.id)}
				{@const issue = issueMap.get(node.issueId)}
				{#if issue}
					<foreignObject
						x={node.x - NODE_WIDTH / 2}
						y={node.y - NODE_HEIGHT / 2}
						width={NODE_WIDTH}
						height={NODE_HEIGHT}
					>
						<DependencyGraphNode
							{issue}
							visualization={getVisualization(node.issueId)}
							selected={selection.selectedIssueId === node.issueId}
							onselect={handleNodeSelect}
							{onhitlquickstart}
						/>
					</foreignObject>
				{/if}
			{/each}
		</svg>
	</div>
{/if}

<style>
	.dependency-graph-container {
		width: 100%;
		height: 100%;
		overflow: auto;
	}

	.dependency-graph-svg {
		width: 100%;
		height: 100%;
		min-height: 200px;
	}
</style>
