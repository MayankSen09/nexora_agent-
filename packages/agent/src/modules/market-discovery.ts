import { CandidateMarket } from "@nexora/shared";
import { MarketDataProvider, FreshnessGuard } from "@nexora/data";
import { db } from "@nexora/database";

export interface DiscoveryFilterOptions {
  minLiquidityUsdc?: number;
  minVolume24hUsdc?: number;
  whitelistedQuotes?: string[];
  maxAllowedAgeMs?: number;
}

export class MarketDiscovery {
  private dataProvider?: MarketDataProvider;

  constructor(dataProvider?: MarketDataProvider) {
    this.dataProvider = dataProvider;
  }

  public setDataProvider(provider: MarketDataProvider): void {
    this.dataProvider = provider;
  }

  /**
   * Discovers and pre-filters active candidate markets.
   */
  public async discoverCandidates(
    marketAddresses: string[] = [],
    options: DiscoveryFilterOptions = {}
  ): Promise<CandidateMarket[]> {
    const minLiquidity = options.minLiquidityUsdc ?? 25000;
    const minVolume = options.minVolume24hUsdc ?? 10000;
    const maxAge = options.maxAllowedAgeMs ?? FreshnessGuard.DEFAULT_MAX_AGE_MS;

    const candidates: CandidateMarket[] = [];

    // 1. If explicit market addresses are provided
    if (marketAddresses.length > 0) {
      for (const address of marketAddresses) {
        // Priority A: Check if registered directly in DB
        const dbMarket = db.getMarketByAddress(address);
        if (dbMarket) {
          candidates.push(dbMarket);
          continue;
        }

        // Priority B: Query live DataProvider if available
        if (this.dataProvider) {
          try {
            const snapshot = await this.dataProvider.getSnapshot(address);
            
            // Verify freshness immediately
            if (!snapshot.freshness.isFresh || snapshot.freshness.ageMs > maxAge) {
              continue; // Skip stale markets
            }

            if (snapshot.liquidityDepthUsdc < minLiquidity || snapshot.volume24hUsdc < minVolume) {
              continue; // Skip illiquid markets
            }

            candidates.push({
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
              opportunityScore: 0,
              isTradeable: true,
              securityStatus: {
                isMintRenounced: true,
                isFreezeDisabled: true,
                isLpLocked: true,
                lpLockedPercent: 100.0,
              },
              lastScannedAt: snapshot.timestamp,
            });
          } catch (err) {
            continue;
          }
        }
      }
    } else {
      // 2. Scan registered database markets if no specific address filter passed
      const dbMarkets = db.getMarkets();
      for (const market of dbMarkets) {
        const freshness = FreshnessGuard.evaluate(market.lastScannedAt, maxAge);
        if (
          freshness.isFresh &&
          market.metrics.liquidityDepthUsdc >= minLiquidity &&
          market.metrics.volume24hUsdc >= minVolume
        ) {
          candidates.push(market);
        }
      }
    }

    return candidates;
  }
}
