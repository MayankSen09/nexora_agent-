import {
  CandidateMarket,
  DecisionLedgerRecord,
  DecisionSignal,
  NexoraTradeDecision,
  NexoraTradeDecisionSchema,
  PortfolioSummary,
  RiskPolicyConfig,
} from "@nexora/shared";
import { FreshnessGuard } from "@nexora/data";
import { DeterministicRiskEngine, RiskValidationResult } from "@nexora/risk-engine";
import { db } from "@nexora/database";
import { AIProvider, MarketAnalysisContext } from "../types.js";

export interface DecisionEngineOptions {
  minConfidenceThreshold?: number;
  maxAllowedAgeMs?: number;
}

export interface DecisionEvaluationResult {
  decision: NexoraTradeDecision;
  riskValidation: RiskValidationResult;
  record: DecisionLedgerRecord;
  isExecutable: boolean;
}

export class DecisionEngine {
  private aiProvider: AIProvider;
  private options: Required<DecisionEngineOptions>;

  constructor(aiProvider: AIProvider, options: DecisionEngineOptions = {}) {
    this.aiProvider = aiProvider;
    this.options = {
      minConfidenceThreshold: options.minConfidenceThreshold ?? 70,
      maxAllowedAgeMs: options.maxAllowedAgeMs ?? FreshnessGuard.DEFAULT_MAX_AGE_MS,
    };
  }

  public setAIProvider(provider: AIProvider): void {
    this.aiProvider = provider;
  }

  public async evaluate(
    market: CandidateMarket,
    signals: DecisionSignal[],
    opportunityScore: number,
    portfolio: PortfolioSummary,
    riskPolicy: RiskPolicyConfig,
    activePositionsCount: number
  ): Promise<DecisionEvaluationResult> {
    const now = new Date().toISOString();
    const pairSymbol = `${market.baseToken.symbol}/${market.quoteToken.symbol}`;

    // 1. Stale-Data Guard: Check data freshness BEFORE calling AI
    const freshness = FreshnessGuard.evaluate(market.lastScannedAt, this.options.maxAllowedAgeMs);
    if (!freshness.isFresh) {
      const staleDecision: NexoraTradeDecision = {
        action: "AVOID",
        confidence: 0,
        positionSizePercent: 0,
        entryReason: `[STALE_DATA_REJECTION]: Market snapshot is ${freshness.status} (Age: ${freshness.ageMs}ms > Max: ${this.options.maxAllowedAgeMs}ms). Decisions from stale feeds are prohibited.`,
        riskLevel: "HIGH",
        invalidationReason: "Data freshness invariant violation",
        timeHorizon: "SCALP_5M",
        signals,
      };

      const record = this.persistDecision(
        now,
        market.address,
        pairSymbol,
        opportunityScore,
        staleDecision,
        "REJECTED",
        "RISK_STALE_DATA"
      );

      return {
        decision: staleDecision,
        riskValidation: {
          approved: false,
          reasonCode: "RISK_POLICY_DISABLED" as any,
          reasonMessage: "Market snapshot is stale.",
          maxAllowedSlippageBps: 0,
        },
        record,
        isExecutable: false,
      };
    }

    // 2. Invoke Abstracted AI Provider
    const context: MarketAnalysisContext = {
      market,
      signals,
      opportunityScore,
      portfolio,
      riskPolicy,
      activePositionsCount,
      timestamp: now,
    };

    let rawDecision: NexoraTradeDecision;
    try {
      rawDecision = await this.aiProvider.analyzeMarket(context);
    } catch (err: any) {
      const failedDecision: NexoraTradeDecision = {
        action: "AVOID",
        confidence: 0,
        positionSizePercent: 0,
        entryReason: `AI invocation failed: ${err.message}`,
        riskLevel: "HIGH",
        invalidationReason: "AI provider runtime error",
        timeHorizon: "SCALP_5M",
        signals,
      };

      const record = this.persistDecision(
        now,
        market.address,
        pairSymbol,
        opportunityScore,
        failedDecision,
        "REJECTED",
        "AI_PROVIDER_ERROR"
      );

      return {
        decision: failedDecision,
        riskValidation: {
          approved: false,
          reasonCode: "RISK_POLICY_DISABLED" as any,
          reasonMessage: "AI provider runtime failure.",
          maxAllowedSlippageBps: 0,
        },
        record,
        isExecutable: false,
      };
    }

    // 3. Strict Schema Validation (Zod Guard)
    const schemaParsed = NexoraTradeDecisionSchema.safeParse(rawDecision);
    if (!schemaParsed.success) {
      const invalidDecision: NexoraTradeDecision = {
        action: "AVOID",
        confidence: 0,
        positionSizePercent: 0,
        entryReason: `[SCHEMA_VALIDATION_ERROR]: AI output failed schema validation: ${schemaParsed.error.message}`,
        riskLevel: "HIGH",
        invalidationReason: "Malformed AI output structure",
        timeHorizon: "SCALP_5M",
        signals,
      };

      const record = this.persistDecision(
        now,
        market.address,
        pairSymbol,
        opportunityScore,
        invalidDecision,
        "REJECTED",
        "INVALID_AI_SCHEMA"
      );

      return {
        decision: invalidDecision,
        riskValidation: {
          approved: false,
          reasonCode: "RISK_POLICY_DISABLED" as any,
          reasonMessage: "AI decision failed schema validation.",
          maxAllowedSlippageBps: 0,
        },
        record,
        isExecutable: false,
      };
    }

    const validatedDecision = schemaParsed.data;

    // 4. Confidence Threshold Gate
    if (validatedDecision.confidence < this.options.minConfidenceThreshold && validatedDecision.action === "BUY") {
      validatedDecision.action = "AVOID";
      validatedDecision.entryReason = `[CONFIDENCE_GATE]: Confidence (${validatedDecision.confidence}%) is below minimum threshold (${this.options.minConfidenceThreshold}%). Position entry aborted.`;

      const record = this.persistDecision(
        now,
        market.address,
        pairSymbol,
        opportunityScore,
        validatedDecision,
        "REJECTED",
        "LOW_CONFIDENCE"
      );

      return {
        decision: validatedDecision,
        riskValidation: {
          approved: false,
          reasonCode: "RISK_POLICY_DISABLED" as any,
          reasonMessage: "Confidence below configured threshold.",
          maxAllowedSlippageBps: 0,
        },
        record,
        isExecutable: false,
      };
    }

    // 5. Deterministic Risk Engine Evaluation
    const riskValidation = DeterministicRiskEngine.validateTradeProposal(
      validatedDecision,
      market,
      portfolio,
      riskPolicy,
      activePositionsCount
    );

    // 6. Persistence: Every decision is recorded in the Decision Ledger
    const record = this.persistDecision(
      now,
      market.address,
      pairSymbol,
      opportunityScore,
      validatedDecision,
      riskValidation.approved ? "APPROVED" : "REJECTED",
      riskValidation.reasonCode,
      riskValidation.clampedSizeUsdc
    );

    return {
      decision: validatedDecision,
      riskValidation,
      record,
      isExecutable: riskValidation.approved && validatedDecision.action === "BUY",
    };
  }

  private persistDecision(
    timestamp: string,
    pairAddress: string,
    pairSymbol: string,
    score: number,
    decision: NexoraTradeDecision,
    riskVerdict: "APPROVED" | "REJECTED",
    rejectionReason?: string,
    clampedPositionSizeUsdc?: number
  ): DecisionLedgerRecord {
    const record: DecisionLedgerRecord = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      pairAddress,
      pairSymbol,
      score,
      decision,
      riskVerdict,
      rejectionReason,
      clampedPositionSizeUsdc,
    };

    db.decisions.unshift(record);
    if (db.decisions.length > 500) {
      db.decisions.pop();
    }

    return record;
  }
}
