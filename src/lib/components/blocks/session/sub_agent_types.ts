export interface SubAgent {
	id: string;
	name: string;
	model: string;
	status: 'running' | 'completed' | 'failed';
	toolCount: number;
	duration: string;
	children: SubAgent[];
}
