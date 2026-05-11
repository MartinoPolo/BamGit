export type CostMagnitude = 'low' | 'medium' | 'high';

export function getCostMagnitude(costUsd: number): CostMagnitude {
	if (costUsd < 1) {
		return 'low';
	}
	if (costUsd < 20) {
		return 'medium';
	}
	return 'high';
}

export function formatCostDisplay(costUsd: number): string {
	return `$${costUsd.toFixed(2)}`;
}
