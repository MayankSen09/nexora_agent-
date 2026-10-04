import { BaseMarketDataProvider } from "./base.js";
import { MarketSnapshot, ProviderOptions } from "../types.js";
import { PROTOCOL_CONSTANTS } from "@nexora/shared";

export interface MockProviderConfig extends ProviderOptions {
  simulatedLatencyMs?: number;
  shouldFail?: boolean;
  mockTimestampOffsetMs?: number; // Allows simulating stale data for tests
}

export class MockMarketDataProvider extends BaseMarketDataProvider {
  public readonly name = "MOCK_PROVIDER";
  private mockConfig: MockProviderConfig;

  constructor(config: MockProviderConfig = {}) {
    super(config);
    this.mockConfig = config;
  }

  public setSimulatedFailure(shouldFail: boolean): void {
    this.mockConfig.shouldFail = shouldFail;
  }

  public setTimestampOffset(offsetMs: number): void {
    this.mockConfig.mockTimestampOffsetMs = offsetMs;
  }

  protected async fetchSnapshotFromSource(marketAddress: string): Promise<MarketSnapshot> {
    if (this.mockConfig.simulatedLatencyMs) {
      await new Promise((resolve) => setTimeout(resolve, this.mockConfig.simulatedLatencyMs));
    }

    if (this.mockConfig.shouldFail) {
      throw new Error(`[MOCK_PROVIDER]: Simulated network/RPC outage for ${marketAddress}`);
    }

    const timestampMs = Date.now() - (this.mockConfig.mockTimestampOffsetMs ?? 0);

    return {
      id: `snap-${marketAddress}-${timestampMs}`,
      timestamp: new Date(timestampMs).toISOString(),
      source: this.name,
      marketAddress,
      baseToken: {
        mint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
        symbol: "SOL",
        name: "Wrapped SOL",
        decimals: 9,
        isVerified: true,
      },
      quoteToken: {
        mint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        isVerified: true,
      },
      priceUsdc: 148.42,
      volume24hUsdc: 4820000.0,
      volume15mUsdc: 185000.0,
      liquidityDepthUsdc: 620000.0,
      feeAprPct: 48.2,
      realizedVolatility1hPct: 2.4,
      orderFlowImbalance: 0.65,
      activeBinId: 24810,
      transactionCount24h: 38420,
      holderCount: 142800,
      top10HolderConcentrationPct: 18.4,
      freshness: {
        timestamp: new Date(timestampMs).toISOString(),
        ageMs: Date.now() - timestampMs,
        maxAllowedAgeMs: 15000,
        isFresh: true,
        status: "FRESH",
      },
    };
  }
}
