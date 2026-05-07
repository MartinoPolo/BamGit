use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

const LITELLM_URL: &str =
    "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

const CACHE_TTL_SECONDS: u64 = 86_400;

const BUNDLED_SNAPSHOT: &str =
    include_str!("../../data/litellm-snapshot.json");

const FAST_MODE_MULTIPLIER_MODELS: &[&str] = &["claude-opus-4-7", "claude-opus-4-6"];

struct ModelPricing {
    input_cost_per_token: f64,
    output_cost_per_token: f64,
    cache_read_cost_per_token: f64,
    cache_write_cost_per_token: f64,
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

pub struct PricingEngine {
    prices: HashMap<String, ModelPricing>,
    cache_path: PathBuf,
}

impl PricingEngine {
    pub fn new(app_data_dir: &Path) -> Self {
        let cache_path = app_data_dir.join("pricing-cache.json");
        let prices = load_initial_prices(&cache_path);
        Self { prices, cache_path }
    }

    pub fn calculate_cost(
        &self,
        model: &str,
        input_tokens: u64,
        output_tokens: u64,
        cache_read: u64,
        cache_write: u64,
        is_fast_mode: bool,
    ) -> f64 {
        let Some(pricing) = self.resolve_model(model) else {
            return 0.0;
        };

        let multiplier = if is_fast_mode
            && FAST_MODE_MULTIPLIER_MODELS
                .iter()
                .any(|&m| model.contains(m))
        {
            6.0_f64
        } else {
            1.0_f64
        };

        multiplier
            * (input_tokens as f64 * pricing.input_cost_per_token
                + output_tokens as f64 * pricing.output_cost_per_token
                + cache_read as f64 * pricing.cache_read_cost_per_token
                + cache_write as f64 * pricing.cache_write_cost_per_token)
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

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs();

        let cache_file = PricingCacheFile {
            timestamp,
            entries: entries.clone(),
        };

        if let Ok(json) = serde_json::to_string(&cache_file) {
            let _ = std::fs::write(&self.cache_path, json);
        }

        self.prices = entries
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
            .collect();

        Ok(())
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
            cache_path: PathBuf::from("/nonexistent/pricing-cache.json"),
        }
    }

    #[test]
    fn cost_calculation_basic() {
        let engine = engine_with_defaults();
        let cost = engine.calculate_cost("claude-sonnet-4-5", 1000, 500, 0, 0, false);
        let expected = 1000.0 * 0.000003 + 500.0 * 0.000015;
        assert!((cost - expected).abs() < 1e-12);
    }

    #[test]
    fn fast_mode_multiplier() {
        let engine = engine_with_defaults();
        let cost_normal = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, false);
        let cost_fast = engine.calculate_cost("claude-opus-4-7", 1000, 500, 0, 0, true);
        assert!((cost_fast - cost_normal * 6.0).abs() < 1e-12);
    }

    #[test]
    fn model_resolution_strips_prefix() {
        let engine = engine_with_defaults();
        let cost_plain = engine.calculate_cost("claude-sonnet-4-5", 1000, 0, 0, 0, false);
        let cost_prefixed =
            engine.calculate_cost("anthropic/claude-sonnet-4-5", 1000, 0, 0, 0, false);
        assert!((cost_plain - cost_prefixed).abs() < 1e-12);
    }

    #[test]
    fn unknown_model_returns_zero() {
        let engine = engine_with_defaults();
        let cost = engine.calculate_cost("unknown-model-xyz", 1000, 500, 100, 50, false);
        assert_eq!(cost, 0.0);
    }
}
