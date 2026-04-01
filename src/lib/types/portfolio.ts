export interface PortfolioDashboardPointer {
	id: string;
	portfolio_dashboard_id: string;
	repo_dashboard_id: string;
	sort_order: number;
}

export interface AddRepoToPortfolioRequest {
	portfolio_dashboard_id: string;
	repo_dashboard_id: string;
}
