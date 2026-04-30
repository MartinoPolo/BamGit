use super::types::UsageData;

/// Per-model pricing (USD per million tokens).
pub struct ModelPricing {
    pub input: f64,
    pub output: f64,
    pub cache_write: f64,
    pub cache_read: f64,
}

/// Get pricing for a model by prefix matching.
pub fn get_model_pricing(model: &str) -> ModelPricing {
    if model.starts_with("claude-sonnet") {
        ModelPricing {
            input: 3.0,
            output: 15.0,
            cache_write: 3.75,
            cache_read: 0.30,
        }
    } else if model.starts_with("claude-opus-4-5") || model.starts_with("claude-opus-4-6") {
        ModelPricing {
            input: 5.0,
            output: 25.0,
            cache_write: 6.25,
            cache_read: 0.50,
        }
    } else if model.starts_with("claude-opus") {
        ModelPricing {
            input: 15.0,
            output: 75.0,
            cache_write: 18.75,
            cache_read: 1.50,
        }
    } else if model.starts_with("claude-haiku-4-5") {
        ModelPricing {
            input: 1.0,
            output: 5.0,
            cache_write: 1.25,
            cache_read: 0.10,
        }
    } else if model.starts_with("claude-haiku") {
        ModelPricing {
            input: 0.80,
            output: 4.0,
            cache_write: 1.0,
            cache_read: 0.08,
        }
    } else {
        // Default: Sonnet pricing
        ModelPricing {
            input: 3.0,
            output: 15.0,
            cache_write: 3.75,
            cache_read: 0.30,
        }
    }
}

/// Calculate USD cost from usage data and pricing.
pub fn calculate_cost(usage: &UsageData, pricing: &ModelPricing) -> f64 {
    let per_million = 1_000_000.0;
    (usage.input_tokens as f64 * pricing.input
        + usage.output_tokens as f64 * pricing.output
        + usage.cache_creation_input_tokens as f64 * pricing.cache_write
        + usage.cache_read_input_tokens as f64 * pricing.cache_read)
        / per_million
}
