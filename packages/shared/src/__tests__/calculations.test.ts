import { describe, test, expect } from "bun:test";
import {
  calculateRealizedPnl,
  calculateUnrealizedPnl,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculatePerformanceMetrics,
  calculatePositionSize,
  NexoraTradeDecisionSchema,
  RiskPolicyConfigSchema,
  StartAgentRequestSchema,
} from "../index.js";

describe("Quantitative Finance & Schema Calculations (@nexora/shared)", () => {
  describe("1. PnL Calculations Unit Tests", () => {
    test("calculateRealizedPnl should accurately compute profit with zero fees", () => {
      // Bought 10 SOL at $150 ($1,500), sold at $165 ($1,650)
      const res = calculateRealizedPnl(150.0, 165.0, 10.0, 0);
      expect(res.realizedPnlUsdc).toBe(150.0);
      expect(res.realizedPnlPct).toBe(10.0);
      expect(res.netPnlUsdc).toBe(150.0);
      expect(res.feeUsdc).toBe(0);
    });

    test("calculateRealizedPnl should deduct fees from net PnL", () => {
      // Bought 10 SOL at $150, sold at $165 with $5.00 fees
      const res = calculateRealizedPnl(150.0, 165.0, 10.0, 5.0);
      expect(res.realizedPnlUsdc).toBe(150.0);
      expect(res.feeUsdc).toBe(5.0);
      expect(res.netPnlUsdc).toBe(145.0);
      expect(res.realizedPnlPct).toBe(9.67);
    });

    test("calculateRealizedPnl should accurately compute loss on stop-out", () => {
      // Bought 10 SOL at $150 ($1,500), stopped out at $142.50 ($1,425) with $2.50 fee
      const res = calculateRealizedPnl(150.0, 142.5, 10.0, 2.5);
      expect(res.realizedPnlUsdc).toBe(-75.0);
      expect(res.netPnlUsdc).toBe(-77.5);
      expect(res.realizedPnlPct).toBe(-5.17);
    });

    test("calculateRealizedPnl should handle zero/invalid inputs gracefully", () => {
      const res = calculateRealizedPnl(0, 150.0, 0, 0);
      expect(res.realizedPnlUsdc).toBe(0);
      expect(res.realizedPnlPct).toBe(0);
    });

    test("calculateUnrealizedPnl should compute mark-to-market floating gain/loss", () => {
      const longGain = calculateUnrealizedPnl(140.0, 154.0, 5.0); // +10%
      expect(longGain.unrealizedPnlUsdc).toBe(70.0);
      expect(longGain.unrealizedPnlPct).toBe(10.0);

      const longLoss = calculateUnrealizedPnl(140.0, 133.0, 5.0); // -5%
      expect(longLoss.unrealizedPnlUsdc).toBe(-35.0);
      expect(longLoss.unrealizedPnlPct).toBe(-5.0);
    });
  });

  describe("2. Portfolio & Risk Metrics Unit Tests", () => {
    test("calculateMaxDrawdown should find maximum peak-to-trough decline", () => {
      // 10,000 -> 12,000 -> 10,800 (-10% from peak) -> 13,000 -> 11,050 (-15% from 13,000) -> 14,000
      const equityCurve = [10000, 12000, 10800, 13000, 11050, 14000];
      const maxDd = calculateMaxDrawdown(equityCurve);
      expect(maxDd).toBe(15.0);
    });

    test("calculateMaxDrawdown should return 0 for strictly monotonic upward curve", () => {
      const equityCurve = [10000, 10500, 11200, 12000, 13500];
      expect(calculateMaxDrawdown(equityCurve)).toBe(0);
    });

    test("calculateSharpeRatio should return annualized risk-adjusted return metric", () => {
      const steadyReturns = [0.01, 0.012, 0.009, 0.011, 0.015, 0.008, 0.013];
      const sharpe = calculateSharpeRatio(steadyReturns, 0.02, 365);
      expect(sharpe).toBeGreaterThan(1.0);
    });

    test("calculatePerformanceMetrics should calculate win rate and profit factor", () => {
      const trades = [
        { realizedPnlUsdc: 150.0 },
        { realizedPnlUsdc: 200.0 },
        { realizedPnlUsdc: -50.0 },
        { realizedPnlUsdc: 100.0 },
        { realizedPnlUsdc: -50.0 },
      ]; // 3 wins ($450), 2 losses ($100) -> Win rate 60%, Profit Factor 4.5
      const perf = calculatePerformanceMetrics(trades);
      expect(perf.winRatePct).toBe(60.0);
      expect(perf.profitFactor).toBe(4.5);
      expect(perf.totalWins).toBe(3);
      expect(perf.totalLosses).toBe(2);
    });

    test("calculatePositionSize should clamp oversized requested allocations", () => {
      // Account has $10,000 equity. Max allowed is 10% ($1,000) with $1,000 hard cap.
      // AI requests 25% ($2,500).
      const clamped = calculatePositionSize(10000, 25.0, 10.0, 1000.0);
      expect(clamped.sizeUsdc).toBe(1000.0);
      expect(clamped.isClamped).toBe(true);
      expect(clamped.isValid).toBe(true);

      // AI requests 5% ($500).
      const normal = calculatePositionSize(10000, 5.0, 10.0, 1000.0);
      expect(normal.sizeUsdc).toBe(500.0);
      expect(normal.isClamped).toBe(false);
      expect(normal.isValid).toBe(true);

      // Position below minimum $25 threshold
      const tiny = calculatePositionSize(100, 5.0, 10.0, 1000.0, 25.0); // $5 on $100 eq
      expect(tiny.sizeUsdc).toBe(5.0);
      expect(tiny.isValid).toBe(false);
    });
  });

  describe("3. AI Decision & Policy Zod Schema Validation", () => {
    test("NexoraTradeDecisionSchema should accept valid structured trade proposals", () => {
      const validDecision = {
        action: "BUY",
        confidence: 88,
        positionSizePercent: 5.0,
        entryReason: "DLMM fee surge breakout on 15m candle",
        riskLevel: "LOW",
        invalidationReason: "Price breaks lower active bin boundary",
        timeHorizon: "SHORT_15M",
        signals: [
          { name: "volume_acceleration", value: 3.2, weight: 0.15 },
          { name: "order_flow_imbalance", value: 0.65, weight: 0.1 },
        ],
      };
      const parsed = NexoraTradeDecisionSchema.parse(validDecision);
      expect(parsed.action).toBe("BUY");
      expect(parsed.confidence).toBe(88);
      expect(parsed.positionSizePercent).toBe(5.0);
    });

    test("NexoraTradeDecisionSchema should reject invalid action strings", () => {
      const invalidAction = {
        action: "HODL_DEGEN",
        confidence: 90,
        positionSizePercent: 5.0,
        entryReason: "Moon mission",
        riskLevel: "LOW",
        invalidationReason: "None",
        timeHorizon: "SHORT_15M",
        signals: [{ name: "vol", value: 1.0, weight: 1.0 }],
      };
      expect(() => NexoraTradeDecisionSchema.parse(invalidAction)).toThrow();
    });

    test("NexoraTradeDecisionSchema should reject out-of-bounds confidence", () => {
      const invalidConf = {
        action: "BUY",
        confidence: 150, // > 100
        positionSizePercent: 5.0,
        entryReason: "Overconfident",
        riskLevel: "LOW",
        invalidationReason: "None",
        timeHorizon: "SHORT_15M",
        signals: [{ name: "vol", value: 1.0, weight: 1.0 }],
      };
      expect(() => NexoraTradeDecisionSchema.parse(invalidConf)).toThrow();
    });

    test("NexoraTradeDecisionSchema should reject excessive position size percent > 10.0%", () => {
      const excessiveSize = {
        action: "BUY",
        confidence: 85,
        positionSizePercent: 50.0, // > 10.0 max
        entryReason: "Too big",
        riskLevel: "HIGH",
        invalidationReason: "None",
        timeHorizon: "SHORT_15M",
        signals: [{ name: "vol", value: 1.0, weight: 1.0 }],
      };
      expect(() => NexoraTradeDecisionSchema.parse(excessiveSize)).toThrow();
    });

    test("RiskPolicyConfigSchema should apply strict institutional defaults", () => {
      const policy = RiskPolicyConfigSchema.parse({
        whitelistedQuoteMints: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
      });
      expect(policy.maxPositionPercent).toBe(5.0);
      expect(policy.maxDailyLossPercent).toBe(3.0);
      expect(policy.maxSlippagePercent).toBe(0.5);
      expect(policy.emergencyStop).toBe(false);
      expect(policy.executionMode).toBe("PAPER_TRADING");
    });
  });
});
