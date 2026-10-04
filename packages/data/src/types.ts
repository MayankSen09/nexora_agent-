import { DexVenue, TokenInfo } from "@nexora/shared";

export type FreshnessStatus = "FRESH" | "ACCEPTABLE" | "STALE" | "EXPIRED";

export interface DataFreshness {
  timestamp: string;
  ageMs: number;
  maxAllowedAgeMs: number;
  isFresh: boolean;
  status: FreshnessStatus;
}

export interface MarketSnapshot {
  id: string;
  timestamp: string;
  source: string; // e.g. "JUPITER_V2", "METEORA_DLMM", "MOCK_FEED"
  marketAddress: string;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  priceUsdc: number;
  volume24hUsdc: number;
  volume15mUsdc: number;
  liquidityDepthUsdc: number;
  feeAprPct: number;
  realizedVolatility1hPct: number;
  orderFlowImbalance: number; // -1.0 to +1.0
  activeBinId?: number;
  transactionCount24h?: number;
  holderCount?: number;
  top10HolderConcentrationPct?: number;
  freshness: DataFreshness;
}

export interface ProviderHealth {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  successRate: number; // 0.0 to 1.0
  totalRequests: number;
  failedRequests: number;
  lastSuccessfulPoll?: string;
  lastErrorMessage?: string;
}

export interface ProviderOptions {
  timeoutMs?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  staleThresholdMs?: number;
  rateLimitBackoffBaseMs?: number;
}

export interface MarketDataProvider {
  readonly name: string;
  getSnapshot(marketAddress: string): Promise<MarketSnapshot>;
  getBatchSnapshots(marketAddresses: string[]): Promise<MarketSnapshot[]>;
  getHealth(): ProviderHealth;
}
