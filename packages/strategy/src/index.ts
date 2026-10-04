import { CandidateMarket, DecisionSignal } from "@nexora/shared";

export interface OpportunityScoreResult {
  score: number; // 0 to 100
  signals: DecisionSignal[];
  isEligibleForAI: boolean;
}

export class OpportunityScorer {
  /**
   * Computes the normalized 0-100 composite opportunity score
   * based on the 10-factor quantitative matrix.
   */
  public static computeScore(market: CandidateMarket): OpportunityScoreResult {
    const metrics = market.metrics;
    const security = market.securityStatus;

    // Security Multiplier Gate
    const isSecurityClean = security.isMintRenounced && security.isFreezeDisabled && security.isLpLocked;
    const riskMultiplier = isSecurityClean ? 1.0 : 0.0;

    // Signal 1: Volume Acceleration (15%)
    const volRatio = metrics.volume15mUsdc / Math.max(1, metrics.volume24hUsdc / 96);
    const sVol = Math.min(1.0, Math.max(0.0, (volRatio - 0.8) / 3.2));

    // Signal 2: Price Momentum (15%)
    const sMom = Math.min(1.0, Math.max(0.0, (metrics.priceChange15mPct + 2.0) / 6.0));

    // Signal 3: Base Liquidity Depth (15%)
    const sLiq = Math.min(1.0, Math.max(0.0, Math.log(metrics.liquidityDepthUsdc / 25000) / Math.log(1000000 / 25000)));

    // Signal 4: Buy/Sell Order Flow Imbalance (10%)
    const sOfi = Math.min(1.0, Math.max(0.0, (metrics.orderFlowImbalance + 1.0) / 2.0));

    // Signal 5: Market Structure (10%)
    const sStruct = metrics.priceChange24hPct > 0 ? 0.85 : 0.35;

    // Signal 6: Volatility Quality (8%)
    const sVolQual = metrics.realizedVolatility1hPct > 0.5 && metrics.realizedVolatility1hPct < 4.0 ? 0.90 : 0.40;

    // Signal 7: Fee Surge (15%)
    const sFee = Math.min(1.0, Math.max(0.0, metrics.feeAprPct / 60.0));

    // Signal 8: Holder Distribution (12%)
    const sHolder = 0.85;

    // Composite Weighted Calculation
    const rawScore =
      (sVol * 0.15 +
        sMom * 0.15 +
        sLiq * 0.15 +
        sOfi * 0.10 +
        sStruct * 0.10 +
        sVolQual * 0.08 +
        sFee * 0.15 +
        sHolder * 0.12) *
      100.0 *
      riskMultiplier;

    const finalScore = Math.round(rawScore * 10) / 10;

    const signals: DecisionSignal[] = [
      { name: "volume_acceleration", value: Math.round(sVol * 100) / 100, weight: 0.15 },
      { name: "price_momentum", value: Math.round(sMom * 100) / 100, weight: 0.15 },
      { name: "liquidity_depth", value: Math.round(sLiq * 100) / 100, weight: 0.15 },
      { name: "order_flow_imbalance", value: Math.round(sOfi * 100) / 100, weight: 0.10 },
      { name: "dlmm_fee_surge", value: Math.round(sFee * 100) / 100, weight: 0.15 },
    ];

    return {
      score: finalScore,
      signals,
      isEligibleForAI: finalScore >= 75.0,
    };
  }
}
