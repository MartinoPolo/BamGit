use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PortfolioDashboardPointer {
    pub id: String,
    pub portfolio_dashboard_id: String,
    pub repo_dashboard_id: String,
    #[ts(type = "number")]
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
pub struct AddRepoToPortfolioRequest {
    pub portfolio_dashboard_id: String,
    pub repo_dashboard_id: String,
}
