import { DataFreshness, FreshnessStatus, MarketSnapshot } from "../types.js";

export class FreshnessGuard {
  public static readonly DEFAULT_MAX_AGE_MS = 15000; // 15 seconds hard threshold for autonomous trading

  /**
   * Computes data freshness metrics for a given timestamp.
   */
  public static evaluate(
    timestampIsoOrMs: string | number,
    maxAllowedAgeMs = FreshnessGuard.DEFAULT_MAX_AGE_MS
  ): DataFreshness {
    const timestampMs = typeof timestampIsoOrMs === "string" ? new Date(timestampIsoOrMs).getTime() : timestampIsoOrMs;
    const now = Date.now();
    const ageMs = Math.max(0, now - timestampMs);

    let status: FreshnessStatus;
    if (ageMs <= 3000) {
      status = "FRESH";
    } else if (ageMs <= maxAllowedAgeMs) {
      status = "ACCEPTABLE";
    } else if (ageMs <= maxAllowedAgeMs * 2) {
      status = "STALE";
    } else {
      status = "EXPIRED";
    }

    const isFresh = status === "FRESH" || status === "ACCEPTABLE";

    return {
      timestamp: new Date(timestampMs).toISOString(),
      ageMs,
      maxAllowedAgeMs,
      isFresh,
      status,
    };
  }

  /**
   * Asserts that a market snapshot is fresh.
   * Throws an error if the data is stale, preventing downstream AI/Risk decisions.
   */
  public static assertFresh(
    snapshot: MarketSnapshot,
    maxAllowedAgeMs = FreshnessGuard.DEFAULT_MAX_AGE_MS
  ): void {
    const freshness = this.evaluate(snapshot.timestamp, maxAllowedAgeMs);
    if (!freshness.isFresh) {
      throw new Error(
        `[STALE_DATA_ERROR]: Market snapshot for ${snapshot.marketAddress} is ${freshness.status} (Age: ${freshness.ageMs}ms, Max Allowed: ${maxAllowedAgeMs}ms). Decisions from stale data are strictly prohibited.`
      );
    }
  }
}
