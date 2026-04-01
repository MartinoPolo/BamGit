use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioDashboardPointer {
    pub id: String,
    pub portfolio_dashboard_id: String,
    pub repo_dashboard_id: String,
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
pub struct AddRepoToPortfolioRequest {
    pub portfolio_dashboard_id: String,
    pub repo_dashboard_id: String,
}
