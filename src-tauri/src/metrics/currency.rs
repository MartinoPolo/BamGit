use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

const FRANKFURTER_URL: &str = "https://api.frankfurter.dev/v1/latest?from=USD";

const CACHE_TTL_SECONDS: u64 = 86_400;

#[derive(Serialize, Deserialize)]
struct CurrencyCacheFile {
    timestamp: u64,
    rates: HashMap<String, f64>,
}

pub struct CurrencyService {
    cache_path: PathBuf,
}

impl CurrencyService {
    pub fn new(app_data_dir: &Path) -> Self {
        Self {
            cache_path: app_data_dir.join("currency-cache.json"),
        }
    }

    pub async fn get_exchange_rates(&self) -> Result<HashMap<String, f64>, Box<dyn std::error::Error>> {
        if let Some(cached) = self.load_cache() {
            return Ok(cached);
        }

        let rates = fetch_rates().await?;
        self.save_cache(&rates);
        Ok(rates)
    }

    fn load_cache(&self) -> Option<HashMap<String, f64>> {
        let content = std::fs::read_to_string(&self.cache_path).ok()?;
        let cache: CurrencyCacheFile = serde_json::from_str(&content).ok()?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs();

        if now.saturating_sub(cache.timestamp) >= CACHE_TTL_SECONDS {
            return None;
        }

        Some(cache.rates)
    }

    fn save_cache(&self, rates: &HashMap<String, f64>) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs();

        let cache = CurrencyCacheFile {
            timestamp,
            rates: rates.clone(),
        };

        if let Ok(json) = serde_json::to_string(&cache) {
            let _ = std::fs::write(&self.cache_path, json);
        }
    }
}

#[derive(Deserialize)]
struct FrankfurterResponse {
    rates: HashMap<String, f64>,
}

async fn fetch_rates() -> Result<HashMap<String, f64>, Box<dyn std::error::Error>> {
    let response = reqwest::get(FRANKFURTER_URL).await?;
    let data: FrankfurterResponse = response.json().await?;
    Ok(data.rates)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn cache_roundtrip() {
        let tmp = TempDir::new().unwrap();
        let service = CurrencyService::new(tmp.path());

        let mut rates = HashMap::new();
        rates.insert("EUR".to_string(), 0.92);
        rates.insert("CZK".to_string(), 22.5);

        service.save_cache(&rates);
        let loaded = service.load_cache().expect("cache should load");

        assert!((loaded["EUR"] - 0.92).abs() < 1e-6);
        assert!((loaded["CZK"] - 22.5).abs() < 1e-6);
    }

    #[test]
    fn stale_cache_returns_none() {
        let tmp = TempDir::new().unwrap();
        let service = CurrencyService::new(tmp.path());

        let stale = CurrencyCacheFile {
            timestamp: 0,
            rates: HashMap::new(),
        };
        let json = serde_json::to_string(&stale).unwrap();
        std::fs::write(&service.cache_path, json).unwrap();

        assert!(service.load_cache().is_none());
    }

    #[test]
    fn missing_cache_returns_none() {
        let tmp = TempDir::new().unwrap();
        let service = CurrencyService::new(tmp.path());
        assert!(service.load_cache().is_none());
    }
}
