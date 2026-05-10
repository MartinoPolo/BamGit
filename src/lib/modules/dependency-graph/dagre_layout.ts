import dagre from '@dagrejs/dagre';
import type { Issue } from '$lib/modules/issues';
import type { IssueDependency } from '$lib/types/generated';
import type { DependencyLayoutResult, DependencyNode, DependencyEdge } from './types';
import {
	NODE_WIDTH,
	NODE_HEIGHT,
	NODE_HORIZONTAL_SPACING,
	NODE_VERTICAL_SPACING,
	FLOATING_ROW_GAP,
} from './types';
import {
	aggregatePrdEdges,
	buildIssuesById,
	findPrdId,
	isCrossPrdEdge,
	isPrdIssue,
} from './prd_grouping';
import { isClosedIssue } from './ready_state';

interface LayoutIssue {
	id: string;
	name: string;
	isPrd: boolean;
}

// `@types/dagre` and `@dagrejs/dagre`'s bundled types disagree on the Graph
// generics shape; `unknown` here is a stable surface across both.
type DagreGraph = ReturnType<typeof createGraph>;

function createGraph() {
	return new dagre.graphlib.Graph();
}

const EMPTY_RESULT: DependencyLayoutResult = {
	nodes: [],
	edges: [],
	graphWidth: 0,
	graphHeight: 0,
};

interface EdgeMeta {
	isCrossPrd: boolean;
	count: number;
}

interface LayoutOptions {
	includeOrphans: boolean;
}

function buildDagreGraph(
	nodes: readonly LayoutIssue[],
	edges: readonly IssueDependency[],
	edgeMetaByKey: Map<string, EdgeMeta>,
	options: LayoutOptions,
): { graph: DagreGraph; nodeIds: Set<string> } {
	const graph = createGraph();
	graph.setGraph({
		rankdir: 'LR',
		nodesep: NODE_VERTICAL_SPACING,
		ranksep: NODE_HORIZONTAL_SPACING,
	});
	graph.setDefaultEdgeLabel(() => ({}));

	const includedIds = new Set<string>();
	if (options.includeOrphans) {
		for (const node of nodes) {
			includedIds.add(node.id);
		}
	} else {
		for (const edge of edges) {
			includedIds.add(edge.blocker_issue_id);
			includedIds.add(edge.blocked_issue_id);
		}
	}

	const nodeMap = new Map(nodes.map((node) => [node.id, node]));

	for (const id of includedIds) {
		const node = nodeMap.get(id);
		if (node === undefined) {
			continue;
		}
		graph.setNode(id, {
			label: node.name,
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
		});
	}

	for (const edge of edges) {
		const key = `${edge.blocker_issue_id}->${edge.blocked_issue_id}`;
		if (graph.hasNode(edge.blocker_issue_id) && graph.hasNode(edge.blocked_issue_id)) {
			graph.setEdge(edge.blocker_issue_id, edge.blocked_issue_id, edgeMetaByKey.get(key));
		}
	}

	return { graph, nodeIds: includedIds };
}

function extractNodes(
	graph: DagreGraph,
	nodes: readonly LayoutIssue[],
	floatingClosedIds: ReadonlySet<string>,
): DependencyNode[] {
	const nodeMap = new Map(nodes.map((node) => [node.id, node]));
	const result: DependencyNode[] = [];
	for (const nodeId of graph.nodes()) {
		const nodeData = graph.node(nodeId) as dagre.Node | undefined;
		const source = nodeMap.get(nodeId);
		if (nodeData == null || source === undefined) {
			continue;
		}
		result.push({
			id: nodeId,
			issueId: nodeId,
			label: source.name,
			x: nodeData.x,
			y: nodeData.y,
			width: nodeData.width,
			height: nodeData.height,
			isPrd: source.isPrd,
			isFloatingClosed: floatingClosedIds.has(nodeId),
		});
	}
	return result;
}

function extractEdges(graph: DagreGraph): DependencyEdge[] {
	const edges: DependencyEdge[] = [];
	for (const edgeObj of graph.edges()) {
		const edgeData = graph.edge(edgeObj) as
			| (dagre.GraphEdge & { isCrossPrd?: boolean; count?: number })
			| undefined;
		if (edgeData != null) {
			edges.push({
				fromId: edgeObj.v,
				toId: edgeObj.w,
				points: edgeData.points ?? [],
				isCrossPrd: edgeData.isCrossPrd ?? false,
				count: edgeData.count ?? 1,
			});
		}
	}
	return edges;
}

function runLayout(
	nodes: readonly LayoutIssue[],
	edges: readonly IssueDependency[],
	edgeMetaByKey: Map<string, EdgeMeta>,
	options: LayoutOptions,
	floatingClosedIds: ReadonlySet<string> = new Set(),
): DependencyLayoutResult {
	if (nodes.length === 0 || (edges.length === 0 && !options.includeOrphans)) {
		return EMPTY_RESULT;
	}
	const { graph, nodeIds } = buildDagreGraph(nodes, edges, edgeMetaByKey, options);
	if (nodeIds.size === 0) {
		return EMPTY_RESULT;
	}
	dagre.layout(graph as Parameters<typeof dagre.layout>[0]);
	const graphInfo = graph.graph() as { width?: number; height?: number } | undefined;
	return {
		nodes: extractNodes(graph, nodes, floatingClosedIds),
		edges: extractEdges(graph),
		graphWidth: graphInfo?.width ?? 0,
		graphHeight: graphInfo?.height ?? 0,
	};
}

function buildEdgeMeta(
	dependencies: readonly IssueDependency[],
	issuesById: ReadonlyMap<string, Issue>,
): Map<string, EdgeMeta> {
	const map = new Map<string, EdgeMeta>();
	for (const dep of dependencies) {
		const key = `${dep.blocker_issue_id}->${dep.blocked_issue_id}`;
		map.set(key, { isCrossPrd: isCrossPrdEdge(dep, issuesById), count: 1 });
	}
	return map;
}

export function computeDependencyLayout(
	issues: readonly Issue[],
	dependencies: readonly IssueDependency[],
): DependencyLayoutResult {
	if (dependencies.length === 0) {
		return EMPTY_RESULT;
	}
	const issuesById = buildIssuesById(issues);
	const layoutIssues: LayoutIssue[] = issues.map((issue) => ({
		id: issue.id,
		name: issue.name,
		isPrd: isPrdIssue(issue),
	}));
	const validDeps = dependencies.filter(
		(dep) => issuesById.has(dep.blocker_issue_id) && issuesById.has(dep.blocked_issue_id),
	);
	const edgeMeta = buildEdgeMeta(validDeps, issuesById);
	return runLayout(layoutIssues, validDeps, edgeMeta, { includeOrphans: false });
}

export function computePrdsLayout(
	issues: readonly Issue[],
	dependencies: readonly IssueDependency[],
): DependencyLayoutResult {
	const issuesById = buildIssuesById(issues);
	const prds = issues.filter(isPrdIssue);
	if (prds.length === 0) {
		return EMPTY_RESULT;
	}
	const layoutIssues: LayoutIssue[] = prds.map((prd) => ({
		id: prd.id,
		name: prd.name,
		isPrd: true,
	}));
	const aggregated = aggregatePrdEdges(dependencies, issuesById);
	const fakeDeps: IssueDependency[] = aggregated.map((edge, index) => ({
		id: `prd-edge-${index}`,
		blocker_issue_id: edge.blockerPrdId,
		blocked_issue_id: edge.blockedPrdId,
	}));
	const edgeMeta = new Map<string, EdgeMeta>();
	for (const edge of aggregated) {
		edgeMeta.set(`${edge.blockerPrdId}->${edge.blockedPrdId}`, {
			isCrossPrd: false,
			count: edge.count,
		});
	}
	return runLayout(layoutIssues, fakeDeps, edgeMeta, { includeOrphans: true });
}

export function computeSinglePrdLayout(
	issues: readonly Issue[],
	dependencies: readonly IssueDependency[],
	prdId: string,
): DependencyLayoutResult {
	const issuesById = buildIssuesById(issues);
	const prd = issuesById.get(prdId);
	if (prd === undefined || !isPrdIssue(prd)) {
		return EMPTY_RESULT;
	}

	const subIssues = issues.filter(
		(issue) => issue.id !== prdId && findPrdId(issue.id, issuesById) === prdId,
	);
	if (subIssues.length === 0) {
		return EMPTY_RESULT;
	}

	const subIssueIds = new Set(subIssues.map((issue) => issue.id));
	const intraDeps = dependencies.filter(
		(dep) => subIssueIds.has(dep.blocker_issue_id) && subIssueIds.has(dep.blocked_issue_id),
	);

	const edgeMeta = buildEdgeMeta(intraDeps, issuesById);

	const closedSubs = subIssues.filter((issue) => isClosedIssue(issue));
	const openSubs = subIssues.filter((issue) => !isClosedIssue(issue));
	const openIds = new Set(openSubs.map((issue) => issue.id));

	const openLayoutIssues: LayoutIssue[] = openSubs.map((issue) => ({
		id: issue.id,
		name: issue.name,
		isPrd: false,
	}));
	const openDeps = intraDeps.filter(
		(dep) => openIds.has(dep.blocker_issue_id) && openIds.has(dep.blocked_issue_id),
	);

	const openResult = runLayout(openLayoutIssues, openDeps, edgeMeta, { includeOrphans: true });

	if (closedSubs.length === 0) {
		return openResult;
	}

	const closedFloatingY = -NODE_HEIGHT / 2 - FLOATING_ROW_GAP;
	const totalClosedWidth =
		closedSubs.length * NODE_WIDTH + (closedSubs.length - 1) * NODE_VERTICAL_SPACING;
	const startX = NODE_WIDTH / 2;

	const closedNodes: DependencyNode[] = closedSubs.map((issue, index) => ({
		id: issue.id,
		issueId: issue.id,
		label: issue.name,
		x: startX + index * (NODE_WIDTH + NODE_VERTICAL_SPACING),
		y: closedFloatingY,
		width: NODE_WIDTH,
		height: NODE_HEIGHT,
		isPrd: false,
		isFloatingClosed: true,
	}));

	const openWidth = openResult.graphWidth;
	const openHeight = openResult.graphHeight;

	return {
		nodes: [...closedNodes, ...openResult.nodes],
		edges: openResult.edges,
		graphWidth: Math.max(openWidth, totalClosedWidth),
		graphHeight: openHeight + FLOATING_ROW_GAP + NODE_HEIGHT,
	};
}
