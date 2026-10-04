import { MarketDataProvider, MarketSnapshot, ProviderHealth } from "../types.js";
import { FreshnessGuard } from "../freshness/freshness-guard.js";

export class CompositeMarketDataProvider implements MarketDataProvider {
  public readonly name = "COMPOSITE_PROVIDER";
  private providers: MarketDataProvider[];

  constructor(providers: MarketDataProvider[]) {
    if (providers.length === 0) {
      throw new Error("[CompositeMarketDataProvider]: At least one provider must be configured.");
    }
    this.providers = providers;
  }

  public async getSnapshot(marketAddress: string): Promise<MarketSnapshot> {
    const errors: Error[] = [];

    for (const provider of this.providers) {
      try {
        const snapshot = await provider.getSnapshot(marketAddress);
        // Verify freshness
        if (snapshot.freshness.isFresh) {
          return snapshot;
        }
      } catch (err: any) {
        errors.push(err);
      }
    }

    throw new Error(
      `[CompositeMarketDataProvider]: All providers failed or returned stale data for ${marketAddress}. Errors: ${errors
        .map((e) => e.message)
        .join("; ")}`
    );
  }

  public async getBatchSnapshots(marketAddresses: string[]): Promise<MarketSnapshot[]> {
    return Promise.all(marketAddresses.map((addr) => this.getSnapshot(addr)));
  }

  public getHealth(): ProviderHealth {
    const healths = this.providers.map((p) => p.getHealth());
    const anyHealthy = healths.some((h) => h.status === "HEALTHY");
    const avgLatency = Math.round(healths.reduce((sum, h) => sum + h.latencyMs, 0) / healths.length);

    return {
      name: this.name,
      status: anyHealthy ? "HEALTHY" : "DOWN",
      latencyMs: avgLatency,
      successRate: healths.reduce((sum, h) => sum + h.successRate, 0) / healths.length,
      totalRequests: healths.reduce((sum, h) => sum + h.totalRequests, 0),
      failedRequests: healths.reduce((sum, h) => sum + h.failedRequests, 0),
      lastSuccessfulPoll: new Date().toISOString(),
    };
  }
}
