import { describe, test, expect } from "bun:test";
import { OpportunityScorer } from "../index.js";
import { CandidateMarket, PROTOCOL_CONSTANTS } from "@nexora/shared";

describe("Quantitative Strategy & Opportunity Scoring (@nexora/strategy)", () => {
  const createMockMarket = (overrides: Partial<CandidateMarket> = {}): CandidateMarket => {
    return {
      address: "Meteora_SOL_USDC_DLMM_1",
      venue: "METEORA_DLMM",
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
      metrics: {
        priceUsdc: 150.0,
        priceNative: 1.0,
        volume24hUsdc: 5000000,
        volume15mUsdc: 200000, // 3.8x baseline
        liquidityDepthUsdc: 750000,
        feeAprPct: 48.0,
        realizedVolatility1hPct: 2.1,
        orderFlowImbalance: 0.65, // Strong buyer pressure
        activeBinId: 24810,
        priceChange24hPct: 4.8,
        priceChange15mPct: 1.5,
      },
      opportunityScore: 0,
      isTradeable: true,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 100.0,
      },
      lastScannedAt: new Date().toISOString(),
      ...overrides,
    };
  };

  describe("1. 10-Factor Opportunity Scoring", () => {
    test("High-momentum, fee-accelerating pool should score high and be eligible for AI", () => {
      const market = createMockMarket();
      const res = OpportunityScorer.computeScore(market);

      expect(res.score).toBeGreaterThanOrEqual(75.0);
      expect(res.isEligibleForAI).toBe(true);
      expect(res.signals.length).toBeGreaterThanOrEqual(5);

      const volSignal = res.signals.find((s) => s.name === "volume_acceleration");
      expect(volSignal).toBeDefined();
      expect(volSignal?.value).toBeGreaterThan(0.5);
    });

    test("Dormant pool with zero volume acceleration should yield low score", () => {
      const dormantMarket = createMockMarket({
        metrics: {
          priceUsdc: 150.0,
          priceNative: 1.0,
          volume24hUsdc: 10000,
          volume15mUsdc: 0, // Zero 15m volume
          liquidityDepthUsdc: 40000,
          feeAprPct: 1.0,
          realizedVolatility1hPct: 0.2,
          orderFlowImbalance: -0.4,
          activeBinId: 24810,
          priceChange24hPct: -2.0,
          priceChange15mPct: -1.0,
        },
      });

      const res = OpportunityScorer.computeScore(dormantMarket);
      expect(res.score).toBeLessThan(70.0);
      expect(res.isEligibleForAI).toBe(false);
    });

    test("Security Gate: Token with active freeze authority MUST receive zero score", () => {
      const freezeActiveMarket = createMockMarket({
        securityStatus: {
          isMintRenounced: true,
          isFreezeDisabled: false, // SECURITY VETO
          isLpLocked: true,
          lpLockedPercent: 100.0,
        },
      });

      const res = OpportunityScorer.computeScore(freezeActiveMarket);
      expect(res.score).toBe(0.0);
      expect(res.isEligibleForAI).toBe(false);
    });

    test("Security Gate: Token with unrenounced mint authority MUST receive zero score", () => {
      const unrenouncedMarket = createMockMarket({
        securityStatus: {
          isMintRenounced: false, // MINT AUTHORITY ACTIVE
          isFreezeDisabled: true,
          isLpLocked: true,
          lpLockedPercent: 100.0,
        },
      });

      const res = OpportunityScorer.computeScore(unrenouncedMarket);
      expect(res.score).toBe(0.0);
      expect(res.isEligibleForAI).toBe(false);
    });

    test("Signal weights should sum to meaningful normalized sub-scores", () => {
      const market = createMockMarket();
      const res = OpportunityScorer.computeScore(market);

      for (const signal of res.signals) {
        expect(signal.value).toBeGreaterThanOrEqual(0.0);
        expect(signal.value).toBeLessThanOrEqual(1.0);
        expect(signal.weight).toBeGreaterThan(0.0);
      }
    });
  });
});
