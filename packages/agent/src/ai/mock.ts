import { AIProvider, MarketAnalysisContext } from "../types.js";
import { NexoraTradeDecision } from "@nexora/shared";

export interface MockAIProviderConfig {
  defaultAction?: "BUY" | "SELL" | "HOLD" | "AVOID";
  confidence?: number;
  positionSizePercent?: number;
  entryReason?: string;
  invalidationReason?: string;
  simulatedLatencyMs?: number;
  shouldFail?: boolean;
  returnInvalidSchema?: boolean;
}

export class MockAIProvider implements AIProvider {
  public readonly name = "MOCK_AI_PROVIDER";
  private config: MockAIProviderConfig;

  constructor(config: MockAIProviderConfig = {}) {
    this.config = {
      defaultAction: config.defaultAction ?? "BUY",
      confidence: config.confidence ?? 88,
      positionSizePercent: config.positionSizePercent ?? 5.0,
      entryReason:
        config.entryReason ??
        "Meteora DLMM active pool exhibiting 3.2x volume surge with fee APR spiking to 48%. Breakout structure confirmed.",
      invalidationReason: config.invalidationReason ?? "Price breaks below lower active bin floor ($142.00).",
      simulatedLatencyMs: config.simulatedLatencyMs ?? 0,
      shouldFail: config.shouldFail ?? false,
      returnInvalidSchema: config.returnInvalidSchema ?? false,
    };
  }

  public setConfig(update: Partial<MockAIProviderConfig>): void {
    this.config = { ...this.config, ...update };
  }

  public async analyzeMarket(context: MarketAnalysisContext): Promise<NexoraTradeDecision> {
    if (this.config.simulatedLatencyMs && this.config.simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.simulatedLatencyMs));
    }

    if (this.config.shouldFail) {
      throw new Error(`[MockAIProvider]: Simulated AI API failure or network timeout.`);
    }

    if (this.config.returnInvalidSchema) {
      // Return an invalid schema object (violates NexoraTradeDecisionSchema)
      return {
        action: "INVALID_ACTION" as any,
        confidence: 999 as any, // Out of bounds
        positionSizePercent: 99.0, // Exceeds max 10.0%
        entryReason: "",
        riskLevel: "EXTREME" as any,
        invalidationReason: "",
        timeHorizon: "UNKNOWN" as any,
        signals: [],
      };
    }

    return {
      action: this.config.defaultAction!,
      confidence: this.config.confidence!,
      positionSizePercent: this.config.positionSizePercent!,
      entryReason: this.config.entryReason!,
      riskLevel: "MEDIUM",
      invalidationReason: this.config.invalidationReason!,
      timeHorizon: "SHORT_15M",
      signals: context.signals.length > 0 ? context.signals : [
        { name: "volume_acceleration", value: 0.85, weight: 0.20 },
        { name: "dlmm_fee_surge", value: 0.92, weight: 0.25 },
        { name: "order_flow_imbalance", value: 0.65, weight: 0.15 },
      ],
    };
  }
}
