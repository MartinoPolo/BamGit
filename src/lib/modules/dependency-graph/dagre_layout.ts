import dagre from '@dagrejs/dagre';
import type { IssueDependency } from '$lib/types/generated';
import type { DependencyLayoutResult, DependencyNode, DependencyEdge } from './types';
import { NODE_WIDTH, NODE_HEIGHT, NODE_HORIZONTAL_SPACING, NODE_VERTICAL_SPACING } from './types';

interface LayoutIssue {
	id: string;
	name: string;
}

type DagreGraph = InstanceType<typeof dagre.graphlib.Graph>;

const EMPTY_RESULT: DependencyLayoutResult = {
	nodes: [],
	edges: [],
	graphWidth: 0,
	graphHeight: 0,
};

function extractNodes(graph: DagreGraph, issueMap: Map<string, LayoutIssue>): DependencyNode[] {
	const nodes: DependencyNode[] = [];
	for (const nodeId of graph.nodes()) {
		const nodeData = graph.node(nodeId) as dagre.Node | undefined;
		if (nodeData != null) {
			const issue = issueMap.get(nodeId);
			nodes.push({
				id: nodeId,
				issueId: nodeId,
				label: issue?.name ?? nodeId,
				x: nodeData.x,
				y: nodeData.y,
				width: nodeData.width,
				height: nodeData.height,
			});
		}
	}
	return nodes;
}

function extractEdges(graph: DagreGraph): DependencyEdge[] {
	const edges: DependencyEdge[] = [];
	for (const edgeObj of graph.edges()) {
		const edgeData = graph.edge(edgeObj) as dagre.GraphEdge | undefined;
		if (edgeData != null) {
			edges.push({
				fromId: edgeObj.v,
				toId: edgeObj.w,
				points: edgeData.points ?? [],
			});
		}
	}
	return edges;
}

export function computeDependencyLayout(
	issues: LayoutIssue[],
	dependencies: IssueDependency[],
): DependencyLayoutResult {
	if (dependencies.length === 0) {
		return EMPTY_RESULT;
	}

	const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

	const validEdges = dependencies.filter(
		(dependency) =>
			issueMap.has(dependency.blocker_issue_id) && issueMap.has(dependency.blocked_issue_id),
	);

	if (validEdges.length === 0) {
		return EMPTY_RESULT;
	}

	const graph = new dagre.graphlib.Graph();
	graph.setGraph({
		rankdir: 'LR',
		nodesep: NODE_VERTICAL_SPACING,
		ranksep: NODE_HORIZONTAL_SPACING,
	});
	graph.setDefaultEdgeLabel(() => ({}));

	const connectedIds = new Set<string>();
	for (const edge of validEdges) {
		connectedIds.add(edge.blocker_issue_id);
		connectedIds.add(edge.blocked_issue_id);
	}

	for (const issueId of connectedIds) {
		const issue = issueMap.get(issueId);
		if (issue == null) {
			continue;
		}
		graph.setNode(issueId, {
			label: issue.name,
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
		});
	}

	for (const edge of validEdges) {
		graph.setEdge(edge.blocker_issue_id, edge.blocked_issue_id);
	}

	dagre.layout(graph);

	const graphInfo = graph.graph();
	return {
		nodes: extractNodes(graph, issueMap),
		edges: extractEdges(graph),
		graphWidth: graphInfo?.width ?? 0,
		graphHeight: graphInfo?.height ?? 0,
	};
}
