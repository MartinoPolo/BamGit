import { invoke } from '@tauri-apps/api/core';
import type { AddRepoToPortfolioRequest, PortfolioDashboardPointer } from '$lib/types/portfolio';

export async function add_repo_to_portfolio(
	request: AddRepoToPortfolioRequest,
): Promise<PortfolioDashboardPointer> {
	return invoke('add_repo_to_portfolio', { request });
}

export async function remove_repo_from_portfolio(
	portfolio_dashboard_id: string,
	repo_dashboard_id: string,
): Promise<void> {
	return invoke('remove_repo_from_portfolio', {
		portfolioDashboardId: portfolio_dashboard_id,
		repoDashboardId: repo_dashboard_id,
	});
}

export async function get_portfolio_repos(
	portfolio_dashboard_id: string,
): Promise<PortfolioDashboardPointer[]> {
	return invoke('get_portfolio_repos', {
		portfolioDashboardId: portfolio_dashboard_id,
	});
}
