import { CandidateMarket } from "@nexora/shared";

export interface AnalyzedMarketFeatures {
  marketAddress: string;
  pairSymbol: string;
  volumeAccelerationRatio: number;
  volatilityRegime: "LOW" | "NORMAL" | "HIGH" | "EXTREME";
  orderFlowBias: "STRONG_BUY" | "MODERATE_BUY" | "NEUTRAL" | "SELL_PRESSURE";
  liquidityTier: "DEEP" | "MODERATE" | "SHALLOW";
  feeYieldTier: "HIGH_YIELD" | "NORMAL" | "LOW";
  isCleanBreakout: boolean;
}

export class MarketAnalyst {
  public analyze(market: CandidateMarket): AnalyzedMarketFeatures {
    const { metrics, baseToken, quoteToken } = market;

    // 1. Volume Acceleration Ratio (15m vs hourly average of 24h volume)
    const hourlyAvg = Math.max(1, metrics.volume24hUsdc / 24);
    const volumeAccelerationRatio = metrics.volume15mUsdc / (hourlyAvg / 4);

    // 2. Volatility Regime
    let volatilityRegime: "LOW" | "NORMAL" | "HIGH" | "EXTREME" = "NORMAL";
    if (metrics.realizedVolatility1hPct < 1.0) volatilityRegime = "LOW";
    else if (metrics.realizedVolatility1hPct > 6.0) volatilityRegime = "EXTREME";
    else if (metrics.realizedVolatility1hPct > 3.5) volatilityRegime = "HIGH";

    // 3. Order Flow Bias
    let orderFlowBias: "STRONG_BUY" | "MODERATE_BUY" | "NEUTRAL" | "SELL_PRESSURE" = "NEUTRAL";
    if (metrics.orderFlowImbalance > 0.5) orderFlowBias = "STRONG_BUY";
    else if (metrics.orderFlowImbalance > 0.15) orderFlowBias = "MODERATE_BUY";
    else if (metrics.orderFlowImbalance < -0.15) orderFlowBias = "SELL_PRESSURE";

    // 4. Liquidity Tier
    let liquidityTier: "DEEP" | "MODERATE" | "SHALLOW" = "MODERATE";
    if (metrics.liquidityDepthUsdc >= 500000) liquidityTier = "DEEP";
    else if (metrics.liquidityDepthUsdc < 100000) liquidityTier = "SHALLOW";

    // 5. Fee Yield Tier (Meteora DLMM fee generation)
    let feeYieldTier: "HIGH_YIELD" | "NORMAL" | "LOW" = "NORMAL";
    if (metrics.feeAprPct >= 40.0) feeYieldTier = "HIGH_YIELD";
    else if (metrics.feeAprPct < 15.0) feeYieldTier = "LOW";

    // 6. Clean Breakout structure
    const isCleanBreakout =
      metrics.priceChange15mPct > 0.5 &&
      metrics.priceChange24hPct > 0 &&
      metrics.orderFlowImbalance > 0.2 &&
      volumeAccelerationRatio > 1.5;

    return {
      marketAddress: market.address,
      pairSymbol: `${baseToken.symbol}/${quoteToken.symbol}`,
      volumeAccelerationRatio: Math.round(volumeAccelerationRatio * 100) / 100,
      volatilityRegime,
      orderFlowBias,
      liquidityTier,
      feeYieldTier,
      isCleanBreakout,
    };
  }
}
