<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { IssueDependency } from '$lib/types/generated';
	import {
		applyDependencyFilter,
		buildIssuesById,
		buildOpenBlockerCounts,
		classifyReadyState,
		computeDependencyLayout,
		computePrdsLayout,
		computeSinglePrdLayout,
		DEFAULT_DEPENDENCY_FILTER,
		extractAreaLabels,
		groupIssuesByPrd,
		isClosedIssue,
		isPrdIssue,
		NODE_HEIGHT,
		NODE_WIDTH,
		VIEW_MODE,
		type DependencyFilter,
		type DependencyLayoutResult,
		type ViewMode,
	} from '$lib/modules/dependency-graph';
	import { useSelection } from '$lib/modules/board';
	import { SvelteMap } from 'svelte/reactivity';
	import DependencyGraphCanvas from './DependencyGraphCanvas.svelte';
	import DependencyGraphFilterBar from './DependencyGraphFilterBar.svelte';
	import DependencyGraphNode from './DependencyGraphNode.svelte';
	import DependencyGraphViewSwitcher from './DependencyGraphViewSwitcher.svelte';
	import NetworkOffIcon from '@lucide/svelte/icons/network';

	interface Props {
		issues: readonly Issue[];
		dependencies: readonly IssueDependency[];
		onhitlquickstart?: (issueId: string) => void;
	}

	let { issues, dependencies, onhitlquickstart }: Props = $props();

	const selection = useSelection();

	let viewMode = $state<ViewMode>(VIEW_MODE.global);
	let selectedPrdId = $state<string | null>(null);
	let filter = $state<DependencyFilter>({ ...DEFAULT_DEPENDENCY_FILTER });

	const allPrdIssues = $derived(issues.filter(isPrdIssue));

	const prdOptions = $derived(allPrdIssues.map((prd) => ({ id: prd.id, name: prd.name })));

	$effect(() => {
		if (viewMode === VIEW_MODE.singlePrd && selectedPrdId === null && allPrdIssues.length > 0) {
			selectedPrdId = allPrdIssues[0].id;
		}
	});

	const filteredIssues = $derived.by(() => {
		const filtered = applyDependencyFilter(issues, filter);
		const filteredIds = new Set(filtered.map((issue) => issue.id));
		const filteredDeps = dependencies.filter(
			(dep) => filteredIds.has(dep.blocker_issue_id) && filteredIds.has(dep.blocked_issue_id),
		);
		return { issues: filtered, dependencies: filteredDeps };
	});

	const issuesById = $derived(buildIssuesById(filteredIssues.issues));

	const layout = $derived.by<DependencyLayoutResult>(() => {
		if (viewMode === VIEW_MODE.global) {
			return computeDependencyLayout(filteredIssues.issues, filteredIssues.dependencies);
		}
		if (viewMode === VIEW_MODE.prds) {
			return computePrdsLayout(filteredIssues.issues, filteredIssues.dependencies);
		}
		if (selectedPrdId === null) {
			return { nodes: [], edges: [], graphWidth: 0, graphHeight: 0 };
		}
		return computeSinglePrdLayout(
			filteredIssues.issues,
			filteredIssues.dependencies,
			selectedPrdId,
		);
	});

	const openBlockerCounts = $derived(
		buildOpenBlockerCounts(filteredIssues.issues, filteredIssues.dependencies),
	);

	const prdGroupSummary = $derived.by(() => {
		const groups = groupIssuesByPrd(issues);
		const summary = new SvelteMap<string, { completed: number; total: number }>();
		for (const group of groups.groups) {
			let completed = 0;
			for (const sub of group.subIssues) {
				if (isClosedIssue(sub)) {
					completed += 1;
				}
			}
			summary.set(group.prd.id, { completed, total: group.subIssues.length });
		}
		return summary;
	});

	const areaOptions = $derived(extractAreaLabels(issues));

	const fitKey = $derived(
		`${viewMode}|${selectedPrdId ?? ''}|${layout.nodes.length}|${layout.graphWidth}|${layout.graphHeight}`,
	);

	const contentDimensions = $derived.by(() => {
		if (layout.nodes.length === 0) {
			return { width: 0, height: 0 };
		}
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		for (const node of layout.nodes) {
			minX = Math.min(minX, node.x - node.width / 2);
			maxX = Math.max(maxX, node.x + node.width / 2);
			minY = Math.min(minY, node.y - node.height / 2);
			maxY = Math.max(maxY, node.y + node.height / 2);
		}
		return { width: maxX - minX, height: maxY - minY, minX, minY };
	});

	function buildEdgePath(points: ReadonlyArray<{ x: number; y: number }>): string {
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
		selection.activateIssue(issueId);
	}

	function handleViewModeChange(mode: ViewMode) {
		viewMode = mode;
		if (mode === VIEW_MODE.singlePrd && selectedPrdId === null && allPrdIssues.length > 0) {
			selectedPrdId = allPrdIssues[0].id;
		}
	}

	function handleSelectedPrdChange(id: string | null) {
		selectedPrdId = id;
	}

	function handleFilterChange(next: DependencyFilter) {
		filter = next;
	}

	const emptyMessage = $derived.by(() => {
		if (viewMode === VIEW_MODE.singlePrd) {
			if (allPrdIssues.length === 0) {
				return 'No PRDs in this workspace';
			}
			if (selectedPrdId === null) {
				return 'Select a PRD to view its sub-issues';
			}
			return 'This PRD has no sub-issues';
		}
		if (viewMode === VIEW_MODE.prds) {
			return 'No PRDs in this workspace';
		}
		return 'No blocking relationships defined';
	});
</script>

<div class="dep-graph-root">
	<div class="dep-graph-toolbar border-b border-border">
		<DependencyGraphViewSwitcher
			{viewMode}
			{selectedPrdId}
			{prdOptions}
			onViewModeChange={handleViewModeChange}
			onSelectedPrdChange={handleSelectedPrdChange}
		/>
		<DependencyGraphFilterBar {filter} {areaOptions} onChange={handleFilterChange} />
	</div>

	<div class="dep-graph-canvas-wrapper">
		{#if layout.nodes.length === 0}
			<div class="dep-graph-empty">
				<NetworkOffIcon size={32} />
				<p>{emptyMessage}</p>
			</div>
		{:else}
			<DependencyGraphCanvas
				contentWidth={contentDimensions.width}
				contentHeight={contentDimensions.height}
				{fitKey}
			>
				{#snippet content()}
					<g
						transform="translate({-(contentDimensions.minX ?? 0)} {-(
							contentDimensions.minY ?? 0
						)})"
					>
						<defs>
							<marker
								id="dep-arrow"
								markerWidth="10"
								markerHeight="8"
								refX="10"
								refY="4"
								orient="auto"
								markerUnits="strokeWidth"
							>
								<path
									d="M 0 0 L 10 4 L 0 8 Z"
									fill="var(--muted-foreground)"
									opacity="0.7"
								/>
							</marker>
							<marker
								id="dep-arrow-cross"
								markerWidth="10"
								markerHeight="8"
								refX="10"
								refY="4"
								orient="auto"
								markerUnits="strokeWidth"
							>
								<path
									d="M 0 0 L 10 4 L 0 8 Z"
									fill="oklch(0.7 0.18 40)"
									opacity="0.85"
								/>
							</marker>
						</defs>

						{#each layout.edges as edge (edge.fromId + '->' + edge.toId)}
							<g class:cross-prd={edge.isCrossPrd}>
								<path
									d={buildEdgePath(edge.points)}
									fill="none"
									stroke={edge.isCrossPrd
										? 'oklch(0.7 0.18 40)'
										: 'var(--muted-foreground)'}
									stroke-width={edge.isCrossPrd ? 2 : 1.5}
									stroke-opacity={edge.isCrossPrd ? 0.8 : 0.45}
									stroke-dasharray={edge.isCrossPrd ? '6 3' : 'none'}
									marker-end={edge.isCrossPrd
										? 'url(#dep-arrow-cross)'
										: 'url(#dep-arrow)'}
								/>
								{#if edge.count > 1}
									{@const midPoint =
										edge.points[Math.floor(edge.points.length / 2)]}
									{#if midPoint !== undefined}
										<g transform="translate({midPoint.x} {midPoint.y})">
											<circle
												r="9"
												fill="var(--card)"
												stroke="var(--border)"
												stroke-width="1"
											/>
											<text
												text-anchor="middle"
												dominant-baseline="central"
												font-size="10"
												font-weight="600"
												fill="var(--foreground)"
											>
												{edge.count}
											</text>
										</g>
									{/if}
								{/if}
							</g>
						{/each}

						{#each layout.nodes as node (node.id)}
							{@const issue = issuesById.get(node.issueId)}
							{#if issue !== undefined}
								<foreignObject
									x={node.x - NODE_WIDTH / 2}
									y={node.y - NODE_HEIGHT / 2}
									width={NODE_WIDTH}
									height={NODE_HEIGHT}
								>
									<DependencyGraphNode
										{issue}
										isPrd={node.isPrd}
										readyState={classifyReadyState({
											issue,
											hasOpenBlockers:
												(openBlockerCounts.get(issue.id) ?? 0) > 0,
										})}
										subIssueProgress={node.isPrd
											? prdGroupSummary.get(issue.id)
											: undefined}
										selected={selection.activeIssueId === node.issueId}
										onselect={handleNodeSelect}
										{onhitlquickstart}
									/>
								</foreignObject>
							{/if}
						{/each}
					</g>
				{/snippet}
			</DependencyGraphCanvas>
		{/if}
	</div>
</div>

<style>
	.dep-graph-root {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 320px;
	}

	.dep-graph-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: var(--card);
	}

	.dep-graph-canvas-wrapper {
		flex: 1;
		position: relative;
		min-height: 0;
	}

	.dep-graph-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		height: 100%;
		padding: 32px;
		color: var(--muted-foreground);
		font-size: 13px;
		opacity: 0.7;
	}
</style>
