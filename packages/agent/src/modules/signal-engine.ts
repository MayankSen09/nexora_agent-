import { CandidateMarket, DecisionSignal } from "@nexora/shared";
import { AnalyzedMarketFeatures } from "./market-analyst.js";

export class SignalEngine {
  public evaluateSignals(market: CandidateMarket, features: AnalyzedMarketFeatures): DecisionSignal[] {
    const { metrics } = market;

    // 1. Volume Acceleration Signal (0 to 1.0)
    const sVol = Math.min(1.0, Math.max(0.0, (features.volumeAccelerationRatio - 0.8) / 3.2));

    // 2. Momentum Signal (0 to 1.0)
    const sMom = Math.min(1.0, Math.max(0.0, (metrics.priceChange15mPct + 2.0) / 6.0));

    // 3. Liquidity Depth Signal (0 to 1.0)
    const sLiq = Math.min(
      1.0,
      Math.max(0.0, Math.log(metrics.liquidityDepthUsdc / 25000) / Math.log(1000000 / 25000))
    );

    // 4. Order Flow Imbalance Signal (0 to 1.0)
    const sOfi = Math.min(1.0, Math.max(0.0, (metrics.orderFlowImbalance + 1.0) / 2.0));

    // 5. DLMM Fee Surge Signal (0 to 1.0)
    const sFee = Math.min(1.0, Math.max(0.0, metrics.feeAprPct / 60.0));

    // 6. Volatility Quality (0 to 1.0)
    const sVolQual = metrics.realizedVolatility1hPct > 0.5 && metrics.realizedVolatility1hPct < 4.0 ? 0.90 : 0.40;

    return [
      { name: "volume_acceleration", value: Math.round(sVol * 100) / 100, weight: 0.20 },
      { name: "price_momentum", value: Math.round(sMom * 100) / 100, weight: 0.20 },
      { name: "liquidity_depth", value: Math.round(sLiq * 100) / 100, weight: 0.15 },
      { name: "dlmm_fee_surge", value: Math.round(sFee * 100) / 100, weight: 0.20 },
      { name: "order_flow_imbalance", value: Math.round(sOfi * 100) / 100, weight: 0.15 },
      { name: "volatility_quality", value: Math.round(sVolQual * 100) / 100, weight: 0.10 },
    ];
  }
}
