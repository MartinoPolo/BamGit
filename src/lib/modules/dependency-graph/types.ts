export interface DependencyNode {
	id: string;
	issueId: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface DependencyEdge {
	fromId: string;
	toId: string;
	points: Array<{ x: number; y: number }>;
}

export interface DependencyLayoutResult {
	nodes: DependencyNode[];
	edges: DependencyEdge[];
	graphWidth: number;
	graphHeight: number;
}

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 80;
export const NODE_HORIZONTAL_SPACING = 80;
export const NODE_VERTICAL_SPACING = 40;
