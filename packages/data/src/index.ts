import { CandidateMarket } from "@nexora/shared";

export class MarketScanner {
  public static async scanActivePools(): Promise<CandidateMarket[]> {
    // In production, queries Meteora DLMM and Jupiter Token API
    return [];
  }
}
