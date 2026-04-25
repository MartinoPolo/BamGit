import { invoke } from '@tauri-apps/api/core';
import type { AddRepoToPortfolioRequest, PortfolioDashboardPointer } from '$lib/types/portfolio';

export async function addRepoToPortfolio(
	request: AddRepoToPortfolioRequest,
): Promise<PortfolioDashboardPointer> {
	return invoke('add_repo_to_portfolio', { request });
}

export async function removeRepoFromPortfolio(
	portfolioDashboardId: string,
	repoDashboardId: string,
): Promise<void> {
	return invoke('remove_repo_from_portfolio', {
		portfolioDashboardId,
		repoDashboardId,
	});
}

export async function getPortfolioRepos(
	portfolioDashboardId: string,
): Promise<PortfolioDashboardPointer[]> {
	return invoke('get_portfolio_repos', {
		portfolioDashboardId,
	});
}
