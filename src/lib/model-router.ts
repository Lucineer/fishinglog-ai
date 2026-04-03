/**
 * Model Router — Phase 1B
 * Routes requests to appropriate model tier based on confidence.
 *
 * Tier 1 (local/cheap):  High-confidence, repetitive topics
 * Tier 2 (standard):     Normal interactions
 * Tier 3 (advanced):     Complex, novel, or low-confidence topics
 */

export type ModelTier = 1 | 2 | 3;

export interface RoutingDecision {
  tier: ModelTier;
  modelOverride: string | null;  // null = use default from config
  reason: string;
}

// Default model names per tier (overridable via config)
const TIER_MODELS: Record<ModelTier, string> = {
  1: 'deepseek-chat',           // local/cheap — good enough for routine
  2: 'deepseek-chat',           // standard — default
  3: 'gpt-4o-mini',             // advanced — more capable fallback
};

export interface RouterConfig {
  tier1Model?: string;
  tier2Model?: string;
  tier3Model?: string;
}

export class ModelRouter {
  private config: RouterConfig;

  constructor(config: RouterConfig = {}) {
    this.config = config;
  }

  /** Determine the best tier for a given topic and confidence. */
  route(topic: string, confidence: number, interactionCount: number): RoutingDecision {
    // Tier 3: novel topics (low confidence, few interactions)
    if (confidence < 0.5 || interactionCount < 5) {
      return {
        tier: 3,
        modelOverride: this.config.tier3Model ?? TIER_MODELS[3],
        reason: `Low confidence (${confidence.toFixed(2)}) or novel topic (${interactionCount} interactions)`,
      };
    }

    // Tier 1: high confidence, well-established patterns
    if (confidence >= 0.85 && interactionCount >= 10) {
      return {
        tier: 1,
        modelOverride: this.config.tier1Model ?? TIER_MODELS[1],
        reason: `High confidence (${confidence.toFixed(2)}) — eligible for demotion to cheaper model`,
      };
    }

    // Tier 2: everything else
    return {
      tier: 2,
      modelOverride: this.config.tier2Model ?? TIER_MODELS[2],
      reason: `Moderate confidence (${confidence.toFixed(2)}) — standard model`,
    };
  }

  /** Get the model name for a tier. */
  getModelForTier(tier: ModelTier): string {
    return this.config[`tier${tier}Model` as keyof RouterConfig] as string
      ?? TIER_MODELS[tier];
  }
}

// Singleton
let _instance: ModelRouter | null = null;
export function getRouter(config?: RouterConfig): ModelRouter {
  if (!_instance) _instance = new ModelRouter(config);
  return _instance;
}
