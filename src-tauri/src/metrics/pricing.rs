use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use rusqlite::Connection;
use serde::{Deserialize, Serialize};

const LITELLM_URL: &str =
    "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

const OPENROUTER_URL: &str = "https://openrouter.ai/api/v1/models";

const CACHE_TTL_SECONDS: u64 = 86_400;

const BUNDLED_SNAPSHOT: &str =
    include_str!("../../data/litellm-snapshot.json");

const DEFAULT_FAST_MODE_MULTIPLIER: f64 = 6.0;

#[derive(Debug, Clone, Serialize)]
pub struct PricingResult {
    pub cost_usd: f64,
    pub pricing_available: bool,
}

pub struct ModelPricing {
    pub input_cost_per_token: f64,
    pub output_cost_per_token: f64,
    pub cache_read_cost_per_token: f64,
    pub cache_write_cost_per_token: f64,
}

#[derive(Deserialize)]
struct LiteLLMModelEntry {
    input_cost_per_token: Option<f64>,
    output_cost_per_token: Option<f64>,
    cache_read_input_token_cost: Option<f64>,
    cache_creation_input_token_cost: Option<f64>,
}

#[derive(Serialize, Deserialize)]
struct PricingCacheFile {
    timestamp: u64,
    entries: HashMap<String, CachedModelPricing>,
}

#[derive(Clone, Serialize, Deserialize)]
struct CachedModelPricing {
    input_cost_per_token: f64,
    output_cost_per_token: f64,
    cache_read_cost_per_token: f64,
    cache_write_cost_per_token: f64,
}

#[derive(Deserialize)]
struct OpenRouterResponse {
    data: Vec<OpenRouterModel>,
}

#[derive(Deserialize)]
struct OpenRouterModel {
    id: String,
    pricing: Option<OpenRouterPricing>,
}

#[derive(Deserialize)]
struct OpenRouterPricing {
    prompt: Option<String>,
    completion: Option<String>,
    #[serde(rename = "input_cache_read")]
    cache_read: Option<String>,
    #[serde(rename = "input_cache_write")]
    cache_write: Option<String>,
}

pub struct PricingEngine {
    prices: HashMap<String, ModelPricing>,
    fast_mode_multipliers: HashMap<String, f64>,
    cache_path: PathBuf,
}

impl PricingEngine {
    pub fn new(app_data_dir: &Path) -> Self {
        let cache_path = app_data_dir.join("pricing-cache.json");
        let prices = load_initial_prices(&cache_path);
        Self {
            prices,
            fast_mode_multipliers: HashMap::new(),
            cache_path,
        }
    }

    pub fn load_overrides_from_database(&mut self, conn: &Connection) {
        let mut stmt = match conn.prepare(
            "SELECT model_id, input_cost_per_token, output_cost_per_token, \
             cache_read_cost_per_token, cache_write_cost_per_token, \
             fast_mode_multiplier, source FROM model_pricing_cache"
        ) {
            Ok(s) => s,
            Err(e) => {
                log::warn!("Failed to load pricing overrides: {e}");
                return;
            }
        };

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, Option<f64>>(3)?,
                row.get::<_, Option<f64>>(4)?,
                row.get::<_, Option<f64>>(5)?,
                row.get::<_, String>(6)?,
            ))
        });

        let rows = match rows {
            Ok(r) => r,
            Err(e) => {
                log::warn!("Failed to query pricing overrides: {e}");
                return;
            }
        };

        for row in rows.flatten() {
            let (model_id, input, output, cache_read, cache_write, multiplier, source) = row;

            if let Some(m) = multiplier {
                self.fast_mode_multipliers.insert(model_id.clone(), m);
            }

            if source == "user" || (input > 0.0 || output > 0.0) {
                let pricing = ModelPricing {
                    input_cost_per_token: input,
                    output_cost_per_token: output,
                    cache_read_cost_per_token: cache_read.unwrap_or(input * 0.1),
                    cache_write_cost_per_token: cache_write.unwrap_or(input * 1.25),
                };
                if source == "user" {
                    self.prices.insert(model_id, pricing);
                } else if !self.prices.contains_key(&model_id) {
                    self.prices.insert(model_id, pricing);
                }
            }
        }
    }

    pub fn calculate_cost(
        &self,
        model: &str,
        input_tokens: u64,
        output_tokens: u64,
        cache_read: u64,
        cache_write: u64,
        is_fast_mode: bool,
    ) -> PricingResult {
        let Some(pricing) = self.resolve_model(model) else {
            return PricingResult {
                cost_usd: 0.0,
                pricing_available: false,
            };
        };

        let multiplier = if is_fast_mode {
            self.resolve_fast_mode_multiplier(model)
        } else {
            1.0
        };

        let cost_usd = multiplier
            * (input_tokens as f64 * pricing.input_cost_per_token
                + output_tokens as f64 * pricing.output_cost_per_token
                + cache_read as f64 * pricing.cache_read_cost_per_token
                + cache_write as f64 * pricing.cache_write_cost_per_token);

        PricingResult {
            cost_usd,
            pricing_available: true,
        }
    }

    pub async fn refresh_from_litellm(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if !is_cache_stale(&self.cache_path) {
            return Ok(());
        }

        let response = reqwest::get(LITELLM_URL).await?;
        let raw: HashMap<String, LiteLLMModelEntry> = response.json().await?;

        let entries: HashMap<String, CachedModelPricing> = raw
            .into_iter()
            .filter_map(|(key, entry)| {
                let input = entry.input_cost_per_token?;
                let output = entry.output_cost_per_token?;
                let cache_read = entry
                    .cache_read_input_token_cost
                    .unwrap_or(input * 0.1);
                let cache_write = entry
                    .cache_creation_input_token_cost
                    .unwrap_or(input * 1.25);
                Some((
                    key,
                    CachedModelPricing {
                        input_cost_per_token: input,
                        output_cost_per_token: output,
                        cache_read_cost_per_token: cache_read,
                        cache_write_cost_per_token: cache_write,
                    },
                ))
            })
            .collect();

        save_cache(&self.cache_path, &entries);
        merge_entries_into_prices(&mut self.prices, entries);
        Ok(())
    }

    pub async fn fetch_from_openrouter(
        &mut self,
        model: &str,
    ) -> Option<()> {
        let response = reqwest::get(OPENROUTER_URL).await.ok()?;
        let data: OpenRouterResponse = response.json().await.ok()?;

        let stripped = strip_provider_prefix(model);
        let found = data.data.iter().find(|m| {
            m.id == model || m.id == stripped || m.id.ends_with(&format!("/{stripped}"))
        })?;

        let pricing = found.pricing.as_ref()?;
        let input = pricing.prompt.as_ref()?.parse::<f64>().ok()?;
        let output = pricing.completion.as_ref()?.parse::<f64>().ok()?;
        let cache_read = pricing.cache_read.as_ref().and_then(|v| v.parse::<f64>().ok()).unwrap_or(input * 0.1);
        let cache_write = pricing.cache_write.as_ref().and_then(|v| v.parse::<f64>().ok()).unwrap_or(input * 1.25);

        self.prices.insert(
            model.to_string(),
            ModelPricing {
                input_cost_per_token: input,
                output_cost_per_token: output,
                cache_read_cost_per_token: cache_read,
                cache_write_cost_per_token: cache_write,
            },
        );

        Some(())
    }

    pub async fn resolve_with_fallback(
        &mut self,
        model: &str,
    ) -> bool {
        if self.resolve_model(model).is_some() {
            return true;
        }

        if self.refresh_from_litellm().await.is_ok() && self.resolve_model(model).is_some() {
            return true;
        }

        self.fetch_from_openrouter(model).await.is_some()
    }

    fn resolve_model(&self, model: &str) -> Option<&ModelPricing> {
        if let Some(pricing) = self.prices.get(model) {
            return Some(pricing);
        }

        let stripped_pin = strip_pin_suffix(model);
        if let Some(pricing) = self.prices.get(stripped_pin.as_ref()) {
            return Some(pricing);
        }

        let stripped_provider = strip_provider_prefix(stripped_pin.as_ref());
        if let Some(pricing) = self.prices.get(stripped_provider) {
            return Some(pricing);
        }

        if let Some(alias_target) = resolve_alias(model) {
            return self.prices.get(alias_target);
        }

        None
    }

    fn resolve_fast_mode_multiplier(&self, model: &str) -> f64 {
        if let Some(&m) = self.fast_mode_multipliers.get(model) {
            return m;
        }

        let pin_stripped = strip_pin_suffix(model);
        let stripped = strip_provider_prefix(&pin_stripped);
        if let Some(&m) = self.fast_mode_multipliers.get(stripped) {
            return m;
        }

        for (key, &multiplier) in &self.fast_mode_multipliers {
            if model.contains(key.as_str()) {
                return multiplier;
            }
        }

        DEFAULT_FAST_MODE_MULTIPLIER
    }
}

fn load_initial_prices(cache_path: &Path) -> HashMap<String, ModelPricing> {
    if let Some(prices) = try_load_cache(cache_path) {
        return prices;
    }
    parse_snapshot(BUNDLED_SNAPSHOT)
}

fn try_load_cache(cache_path: &Path) -> Option<HashMap<String, ModelPricing>> {
    let content = std::fs::read_to_string(cache_path).ok()?;
    let cache_file: PricingCacheFile = serde_json::from_str(&content).ok()?;
    Some(cached_entries_to_pricing(cache_file.entries))
}

fn parse_snapshot(json: &str) -> HashMap<String, ModelPricing> {
    let raw: HashMap<String, LiteLLMModelEntry> =
        serde_json::from_str(json).unwrap_or_default();
    raw.into_iter()
        .filter_map(|(key, entry)| {
            let input = entry.input_cost_per_token?;
            let output = entry.output_cost_per_token?;
            let cache_read = entry
                .cache_read_input_token_cost
                .unwrap_or(input * 0.1);
            let cache_write = entry
                .cache_creation_input_token_cost
                .unwrap_or(input * 1.25);
            Some((
                key,
                ModelPricing {
                    input_cost_per_token: input,
                    output_cost_per_token: output,
                    cache_read_cost_per_token: cache_read,
                    cache_write_cost_per_token: cache_write,
                },
            ))
        })
        .collect()
}

fn cached_entries_to_pricing(
    entries: HashMap<String, CachedModelPricing>,
) -> HashMap<String, ModelPricing> {
    entries
        .into_iter()
        .map(|(key, cached)| {
            (
                key,
                ModelPricing {
                    input_cost_per_token: cached.input_cost_per_token,
                    output_cost_per_token: cached.output_cost_per_token,
                    cache_read_cost_per_token: cached.cache_read_cost_per_token,
                    cache_write_cost_per_token: cached.cache_write_cost_per_token,
                },
            )
        })
        .collect()
}

fn save_cache(cache_path: &Path, entries: &HashMap<String, CachedModelPricing>) {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs();

    let cache_file = PricingCacheFile {
        timestamp,
        entries: entries.clone(),
    };

    if let Ok(json) = serde_json::to_string(&cache_file) {
        let _ = std::fs::write(cache_path, json);
    }
}

fn merge_entries_into_prices(
    prices: &mut HashMap<String, ModelPricing>,
    entries: HashMap<String, CachedModelPricing>,
) {
    for (key, cached) in entries {
        prices.insert(
            key,
            ModelPricing {
                input_cost_per_token: cached.input_cost_per_token,
                output_cost_per_token: cached.output_cost_per_token,
                cache_read_cost_per_token: cached.cache_read_cost_per_token,
                cache_write_cost_per_token: cached.cache_write_cost_per_token,
            },
        );
    }
}

fn is_cache_stale(cache_path: &Path) -> bool {
    let Ok(content) = std::fs::read_to_string(cache_path) else {
        return true;
    };
    let Ok(cache_file) = serde_json::from_str::<PricingCacheFile>(&content) else {
        return true;
    };
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs();
    now.saturating_sub(cache_file.timestamp) >= CACHE_TTL_SECONDS
}

fn strip_pin_suffix(model: &str) -> std::borrow::Cow<'_, str> {
    if let Some(at_pos) = model.rfind('@') {
        std::borrow::Cow::Owned(model[..at_pos].to_owned())
    } else {
        std::borrow::Cow::Borrowed(model)
    }
}

fn strip_provider_prefix(model: &str) -> &str {
    if let Some(slash_pos) = model.find('/') {
        &model[slash_pos + 1..]
    } else {
        model
    }
}

fn resolve_alias(model: &str) -> Option<&'static str> {
    let aliases: &[(&str, &str)] = &[("cursor-auto", "claude-sonnet-4-5")];
    aliases
        .iter()
        .find(|(alias, _)| *alias == model)
        .map(|(_, target)| *target)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn engine_with_defaults() -> PricingEngine {
        let prices = parse_snapshot(BUNDLED_SNAPSHOT);
        PricingEngine {
            prices,
            fast_mode_multipliers: HashMap::from([
                ("claude-opus-4-7".to_string(), 6.0),
                ("claude-opus-4-6".to_string(), 6.0),
            ]),
            cache_path: PathBuf::from("/nonexistent/pricing-cache.json"),
        }
    }

    #[test]
    fn cost_calculation_basic() {
        let engine = engine_with_defaults();
        let result = engine.calculate_cost("claude-sonnet-4-5", 1000, 500, 0, 0, false);
        let expected = 1000.0 * 0.000003 + 500.0 * 0.000015;
        assert!(result.pricing_available);
        assert!((result.cost_usd - expected).abs() < 1e-12);
    }

    #[test]
    fn fast_mode_multiplier() {
        let engine = engine_with_defaults();
        let result_normal = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, false);
        let result_fast = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, true);
        assert!((result_fast.cost_usd - result_normal.cost_usd * 6.0).abs() < 1e-12);
    }

    #[test]
    fn model_resolution_strips_prefix() {
        let engine = engine_with_defaults();
        let result_plain = engine.calculate_cost("claude-sonnet-4-5", 1000, 0, 0, 0, false);
        let result_prefixed =
            engine.calculate_cost("anthropic/claude-sonnet-4-5", 1000, 0, 0, 0, false);
        assert!((result_plain.cost_usd - result_prefixed.cost_usd).abs() < 1e-12);
    }

    #[test]
    fn unknown_model_returns_pricing_unavailable() {
        let engine = engine_with_defaults();
        let result = engine.calculate_cost("unknown-model-xyz", 1000, 500, 100, 50, false);
        assert_eq!(result.cost_usd, 0.0);
        assert!(!result.pricing_available);
    }

    #[test]
    fn db_overrides_take_priority() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        crate::database::schema::create_tables(&conn).unwrap();

        conn.execute(
            "INSERT INTO model_pricing_cache \
             (model_id, input_cost_per_token, output_cost_per_token, source) \
             VALUES ('claude-sonnet-4-5', 0.001, 0.002, 'user')",
            [],
        )
        .unwrap();

        let mut engine = engine_with_defaults();
        engine.load_overrides_from_database(&conn);

        let result = engine.calculate_cost("claude-sonnet-4-5", 1000, 500, 0, 0, false);
        let expected = 1000.0 * 0.001 + 500.0 * 0.002;
        assert!(result.pricing_available);
        assert!((result.cost_usd - expected).abs() < 1e-12);
    }

    #[test]
    fn fast_mode_multiplier_from_database() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        crate::database::schema::create_tables(&conn).unwrap();

        conn.execute(
            "INSERT INTO model_pricing_cache \
             (model_id, input_cost_per_token, output_cost_per_token, fast_mode_multiplier, source) \
             VALUES ('claude-opus-4-7', 0.0, 0.0, 8.0, 'litellm')",
            [],
        )
        .unwrap();

        let mut engine = engine_with_defaults();
        engine.load_overrides_from_database(&conn);

        let result_normal = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, false);
        let result_fast = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, true);
        assert!((result_fast.cost_usd - result_normal.cost_usd * 8.0).abs() < 1e-12);
    }
}
