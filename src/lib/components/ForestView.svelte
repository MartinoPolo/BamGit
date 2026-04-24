<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import type { GitStatusCache } from '$lib/types/git_status';
	import type { TreeVisualization } from '$lib/types/tree_visualization';
	import type { ForestLayoutItem, PositionedForestItem } from '$lib/engine/forest_layout';
	import { compute_forest_layout } from '$lib/engine/forest_layout';
	import { compute_tree_visualization } from '$lib/engine/compute_tree_visualization';
	import {
		map_issue_to_state_dimensions,
		type SessionForMapping,
	} from '$lib/engine/map_issue_to_state_dimensions';
	import { SvelteMap } from 'svelte/reactivity';
	import { LowPolyTree, PottedPlant } from 'low-poly-2d-trees';

	interface Props {
		issues: readonly Issue[];
		get_git_status: (issue_id: string) => GitStatusCache | undefined;
		get_sessions_for_issue: (issue_id: string) => readonly SessionForMapping[];
		on_select_issue: (issue: Issue) => void;
	}

	let { issues, get_git_status, get_sessions_for_issue, on_select_issue }: Props = $props();

	const TREE_NATURAL_WIDTH = 100;
	const TREE_NATURAL_HEIGHT = 100;
	const POTTED_NATURAL_WIDTH = 60;
	const POTTED_NATURAL_HEIGHT = 90;

	let viewport_width = $state(0);
	let viewport_height = $state(0);

	type RenderableVisualization = Exclude<TreeVisualization, { kind: 'oak' }>;

	interface IssueEntry {
		readonly issue: Issue;
		readonly visualization: RenderableVisualization;
		readonly layout_item: ForestLayoutItem;
	}

	const entries = $derived.by<readonly IssueEntry[]>(() => {
		const results: IssueEntry[] = [];
		for (const issue of issues) {
			const dimensions = map_issue_to_state_dimensions(
				issue,
				get_git_status(issue.id),
				get_sessions_for_issue(issue.id),
			);
			const visualization = compute_tree_visualization(dimensions);
			if (visualization.kind === 'oak') {
				continue;
			}
			const renderable: RenderableVisualization = visualization;
			results.push({
				issue,
				visualization: renderable,
				layout_item: build_layout_item(issue, renderable),
			});
		}
		return results;
	});

	const entry_by_id = $derived.by(() => {
		const map = new SvelteMap<string, IssueEntry>();
		for (const entry of entries) {
			map.set(entry.issue.id, entry);
		}
		return map;
	});

	const layout_result = $derived(
		compute_forest_layout(
			entries.map((entry) => entry.layout_item),
			{ width: viewport_width, height: viewport_height },
		),
	);

	function build_layout_item(
		issue: Issue,
		visualization: RenderableVisualization,
	): ForestLayoutItem {
		if (visualization.kind === 'tree') {
			return {
				id: issue.id,
				kind: 'tree',
				stage: visualization.config.stage,
				priority: issue.priority,
				sortOrder: issue.sort_order,
			};
		}
		return {
			id: issue.id,
			kind: 'potted-plant',
			stage: visualization.stage,
			priority: issue.priority,
			sortOrder: issue.sort_order,
		};
	}

	function get_natural_size(entry: IssueEntry): { width: number; height: number } {
		if (entry.visualization.kind === 'potted-plant') {
			return { width: POTTED_NATURAL_WIDTH, height: POTTED_NATURAL_HEIGHT };
		}
		return { width: TREE_NATURAL_WIDTH, height: TREE_NATURAL_HEIGHT };
	}

	function handle_select(positioned: PositionedForestItem) {
		const entry = entry_by_id.get(positioned.id);
		if (entry !== undefined) {
			on_select_issue(entry.issue);
		}
	}
</script>

<div
	class="relative h-[600px] w-full overflow-hidden rounded-md border border-border bg-muted/10"
	bind:clientWidth={viewport_width}
	bind:clientHeight={viewport_height}
>
	{#if issues.length === 0}
		<p class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
			No issues to visualise.
		</p>
	{:else}
		{#each layout_result.items as positioned (positioned.id)}
			{@const entry = entry_by_id.get(positioned.id)}
			{#if entry}
				{@const size = get_natural_size(entry)}
				<button
					type="button"
					class="absolute cursor-pointer border-0 bg-transparent p-0 transition-transform hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring"
					style:left="{positioned.x}px"
					style:top="{positioned.y}px"
					style:width="{size.width}px"
					style:height="{size.height}px"
					style:transform="translate(-50%, -50%) scale({positioned.scale})"
					style:opacity={positioned.opacity}
					style:z-index={positioned.zIndex}
					onclick={() => handle_select(positioned)}
					title={entry.issue.name}
					aria-label="Open issue {entry.issue.name}"
				>
					{#if entry.visualization.kind === 'tree'}
						<LowPolyTree
							config={entry.visualization.config}
							toolVisibility={entry.visualization.toolVisibility}
							overlayConfig={entry.visualization.overlayConfig}
						/>
					{:else if entry.visualization.kind === 'potted-plant'}
						<PottedPlant
							stage={entry.visualization.stage}
							seed={entry.visualization.seed}
						/>
					{/if}
				</button>
			{/if}
		{/each}
	{/if}
</div>
