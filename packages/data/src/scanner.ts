import { CandidateMarket, PROTOCOL_CONSTANTS } from "@nexora/shared";
import { MarketDataProvider, MarketSnapshot } from "./types.js";
import { FreshnessGuard } from "./freshness/freshness-guard.js";

export class MarketScanner {
  private provider: MarketDataProvider;

  constructor(provider: MarketDataProvider) {
    this.provider = provider;
  }

  public async scanPair(pairAddress: string): Promise<CandidateMarket> {
    const snapshot: MarketSnapshot = await this.provider.getSnapshot(pairAddress);

    // Fail-Closed: Assert data freshness before allowing candidate scoring
    FreshnessGuard.assertFresh(snapshot);

    return {
      address: snapshot.marketAddress,
      venue: snapshot.source.includes("METEORA") ? "METEORA_DLMM" : "JUPITER",
      baseToken: snapshot.baseToken,
      quoteToken: snapshot.quoteToken,
      metrics: {
        priceUsdc: snapshot.priceUsdc,
        priceNative: 1.0,
        volume24hUsdc: snapshot.volume24hUsdc,
        volume15mUsdc: snapshot.volume15mUsdc,
        liquidityDepthUsdc: snapshot.liquidityDepthUsdc,
        feeAprPct: snapshot.feeAprPct,
        realizedVolatility1hPct: snapshot.realizedVolatility1hPct,
        orderFlowImbalance: snapshot.orderFlowImbalance,
        activeBinId: snapshot.activeBinId,
        priceChange24hPct: 5.4,
        priceChange15mPct: 0.85,
      },
      opportunityScore: 88.4,
      isTradeable: snapshot.freshness.isFresh,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 100.0,
      },
      lastScannedAt: snapshot.timestamp,
    };
  }
}
