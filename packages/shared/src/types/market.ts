export type DexVenue = "METEORA_DLMM" | "METEORA_DYNAMIC" | "JUPITER";

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isVerified: boolean;
}

export interface MarketMetrics {
  priceUsdc: number;
  priceNative: number;
  volume24hUsdc: number;
  volume15mUsdc: number;
  liquidityDepthUsdc: number;
  feeAprPct: number;
  realizedVolatility1hPct: number;
  orderFlowImbalance: number; // -1.0 to 1.0
  activeBinId?: number;
  priceChange24hPct: number;
  priceChange15mPct: number;
}

export interface CandidateMarket {
  address: string;
  venue: DexVenue;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  metrics: MarketMetrics;
  opportunityScore: number;
  isTradeable: boolean;
  securityStatus: {
    isMintRenounced: boolean;
    isFreezeDisabled: boolean;
    isLpLocked: boolean;
    lpLockedPercent: number;
  };
  lastScannedAt: string;
}
