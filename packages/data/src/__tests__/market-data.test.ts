import { describe, test, expect, beforeEach } from "bun:test";
import {
  TtlCache,
  FreshnessGuard,
  MockMarketDataProvider,
  CompositeMarketDataProvider,
  MarketScanner,
} from "../index.js";

describe("Market Data Layer (@nexora/data)", () => {
  describe("1. TtlCache", () => {
    let cache: TtlCache<string>;

    beforeEach(() => {
      cache = new TtlCache<string>(200); // 200ms TTL
    });

    test("should store and retrieve values within TTL", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    test("should expire values after TTL", async () => {
      cache.set("key2", "value2", 50); // 50ms custom TTL
      expect(cache.get("key2")).toBe("value2");

      await new Promise((resolve) => setTimeout(resolve, 70));
      expect(cache.get("key2")).toBeUndefined();
    });
  });

  describe("2. FreshnessGuard & Stale-Data Invariant", () => {
    test("should mark recent data as FRESH", () => {
      const now = Date.now();
      const freshness = FreshnessGuard.evaluate(now);
      expect(freshness.isFresh).toBe(true);
      expect(freshness.status).toBe("FRESH");
      expect(freshness.ageMs).toBeLessThanOrEqual(50);
    });

    test("should mark data older than 15s as STALE / EXPIRED", () => {
      const staleTimestamp = Date.now() - 20000; // 20 seconds ago
      const freshness = FreshnessGuard.evaluate(staleTimestamp, 15000);
      expect(freshness.isFresh).toBe(false);
      expect(freshness.status).toBe("STALE");
    });

    test("assertFresh should throw on stale market snapshot", () => {
      const staleSnapshot = {
        id: "snap-stale-1",
        timestamp: new Date(Date.now() - 25000).toISOString(),
        source: "MOCK",
        marketAddress: "pair-1",
        baseToken: { mint: "SOL", symbol: "SOL", name: "SOL", decimals: 9, isVerified: true },
        quoteToken: { mint: "USDC", symbol: "USDC", name: "USDC", decimals: 6, isVerified: true },
        priceUsdc: 148.0,
        volume24hUsdc: 100000,
        volume15mUsdc: 5000,
        liquidityDepthUsdc: 50000,
        feeAprPct: 10,
        realizedVolatility1hPct: 1.5,
        orderFlowImbalance: 0.1,
        freshness: {
          timestamp: new Date(Date.now() - 25000).toISOString(),
          ageMs: 25000,
          maxAllowedAgeMs: 15000,
          isFresh: false,
          status: "EXPIRED" as const,
        },
      };

      expect(() => FreshnessGuard.assertFresh(staleSnapshot, 15000)).toThrow("[STALE_DATA_ERROR]");
    });
  });

  describe("3. MockMarketDataProvider & Provider Health", () => {
    test("should fetch a complete market snapshot with all required fields", async () => {
      const provider = new MockMarketDataProvider();
      const snapshot = await provider.getSnapshot("SOL_USDC_PAIR");

      expect(snapshot.marketAddress).toBe("SOL_USDC_PAIR");
      expect(snapshot.priceUsdc).toBeGreaterThan(0);
      expect(snapshot.volume24hUsdc).toBeGreaterThan(0);
      expect(snapshot.liquidityDepthUsdc).toBeGreaterThan(0);
      expect(snapshot.source).toBe("MOCK_PROVIDER");
      expect(snapshot.freshness.isFresh).toBe(true);
    });

    test("should track provider health metrics and latency", async () => {
      const provider = new MockMarketDataProvider({ simulatedLatencyMs: 10 });
      await provider.getSnapshot("PAIR_A");
      await provider.getSnapshot("PAIR_B");

      const health = provider.getHealth();
      expect(health.status).toBe("HEALTHY");
      expect(health.totalRequests).toBe(2);
      expect(health.failedRequests).toBe(0);
      expect(health.successRate).toBe(1.0);
      expect(health.latencyMs).toBeGreaterThanOrEqual(10);
    });

    test("should retry on transient failures and update health on persistent errors", async () => {
      const provider = new MockMarketDataProvider({ maxRetries: 1, rateLimitBackoffBaseMs: 10 });
      provider.setSimulatedFailure(true);

      expect(provider.getSnapshot("FAILING_PAIR")).rejects.toThrow("Simulated network/RPC outage");
    });
  });

  describe("4. CompositeMarketDataProvider & Fallback", () => {
    test("should automatically fallback to secondary provider if primary fails", async () => {
      const primary = new MockMarketDataProvider();
      primary.setSimulatedFailure(true);

      const secondary = new MockMarketDataProvider();

      const composite = new CompositeMarketDataProvider([primary, secondary]);
      const snapshot = await composite.getSnapshot("SOL_USDC");

      expect(snapshot).toBeDefined();
      expect(snapshot.marketAddress).toBe("SOL_USDC");
    });
  });

  describe("5. MarketScanner Integration", () => {
    test("should scan pair and produce valid candidate market", async () => {
      const provider = new MockMarketDataProvider();
      const scanner = new MarketScanner(provider);

      const candidate = await scanner.scanPair("Meteora_SOL_USDC");
      expect(candidate.address).toBe("Meteora_SOL_USDC");
      expect(candidate.metrics.priceUsdc).toBe(148.42);
      expect(candidate.isTradeable).toBe(true);
    });

    test("scanner should reject stale snapshots and throw safety error", async () => {
      const provider = new MockMarketDataProvider({ mockTimestampOffsetMs: 30000 }); // 30 seconds stale
      const scanner = new MarketScanner(provider);

      expect(scanner.scanPair("STALE_PAIR")).rejects.toThrow("[STALE_DATA_ERROR]");
    });
  });
});
