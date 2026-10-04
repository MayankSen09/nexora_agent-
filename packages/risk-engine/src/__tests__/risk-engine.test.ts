import { describe, test, expect } from "bun:test";
import { DeterministicRiskEngine } from "../index.js";
import {
  NexoraTradeDecision,
  CandidateMarket,
  PortfolioSummary,
  RiskPolicyConfig,
  REJECTION_REASONS,
  PROTOCOL_CONSTANTS,
} from "@nexora/shared";

describe("Deterministic Risk Engine (@nexora/risk-engine)", () => {
  const mockMarket: CandidateMarket = {
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
      volume15mUsdc: 200000,
      liquidityDepthUsdc: 500000,
      feeAprPct: 45.0,
      realizedVolatility1hPct: 2.2,
      orderFlowImbalance: 0.65,
      activeBinId: 24810,
      priceChange24hPct: 4.5,
      priceChange15mPct: 1.2,
    },
    opportunityScore: 88.0,
    isTradeable: true,
    securityStatus: {
      isMintRenounced: true,
      isFreezeDisabled: true,
      isLpLocked: true,
      lpLockedPercent: 100.0,
    },
    lastScannedAt: new Date().toISOString(),
  };

  const mockPortfolio: PortfolioSummary = {
    totalEquityUsdc: 10000.0,
    freeCashUsdc: 10000.0,
    allocatedCapitalUsdc: 0.0,
    utilizationPct: 0.0,
    unrealizedPnlUsdc: 0.0,
    unrealizedPnlPct: 0.0,
    realizedPnl24hUsdc: 0.0,
    realizedPnl24hPct: 0.0,
    winRatePct: 75.0,
    profitFactor: 3.2,
    totalTradesCount: 12,
    winningTradesCount: 9,
    losingTradesCount: 3,
    maxDrawdown24hPct: 0.8,
    updatedAt: new Date().toISOString(),
  };

  const defaultPolicy: RiskPolicyConfig = {
    maxPositionPercent: 5.0, // 5% ($500 cap on $10k)
    maxDailyLossPercent: 3.0, // -3% 24h loss breaker
    maxTokenExposurePercent: 10.0,
    maxSlippagePercent: 0.5, // 50 bps
    maxOpenPositions: 3,
    minLiquidityUsd: 50000.0,
    emergencyStop: false,
    whitelistedQuoteMints: [PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET],
    executionMode: "DEVNET",
  };

  const validDecision: NexoraTradeDecision = {
    action: "BUY",
    confidence: 88,
    positionSizePercent: 5.0,
    entryReason: "Valid breakout momentum",
    riskLevel: "LOW",
    invalidationReason: "Support breach",
    timeHorizon: "SHORT_15M",
    signals: [{ name: "vol", value: 3.0, weight: 0.2 }],
  };

  describe("1. Deterministic Invariant Verifications", () => {
    test("Should approve valid trade proposal within limits", () => {
      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        mockMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(true);
      expect(res.clampedSizeUsdc).toBe(500.0);
      expect(res.maxAllowedSlippageBps).toBe(50);
    });

    test("Emergency Kill Switch should immediately reject any trade proposal", () => {
      const policyWithKillSwitch: RiskPolicyConfig = {
        ...defaultPolicy,
        emergencyStop: true,
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        mockMarket,
        mockPortfolio,
        policyWithKillSwitch,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_KILL_SWITCH_ACTIVE);
    });

    test("Should reject proposals when action is not BUY", () => {
      const holdDecision: NexoraTradeDecision = {
        ...validDecision,
        action: "HOLD",
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        holdDecision,
        mockMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_POLICY_DISABLED);
    });

    test("Daily Drawdown Circuit Breaker should veto trades if 24h loss exceeds limit", () => {
      const breachedPortfolio: PortfolioSummary = {
        ...mockPortfolio,
        realizedPnl24hPct: -3.5, // Exceeds -3.0% limit
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        mockMarket,
        breachedPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_DAILY_LOSS_LIMIT);
    });

    test("Concurrent Positions Ceiling should reject new trade when limit reached", () => {
      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        mockMarket,
        mockPortfolio,
        defaultPolicy,
        3 // Max is 3
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_MAX_OPEN_POSITIONS);
    });

    test("Security check should reject token if mint or freeze authority is active", () => {
      const unsafeMarket: CandidateMarket = {
        ...mockMarket,
        securityStatus: {
          ...mockMarket.securityStatus,
          isMintRenounced: false, // UNSAFE
        },
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        unsafeMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_TOKEN_UNSAFE);
    });

    test("Pool Liquidity Floor should reject pools below minimum requirement", () => {
      const lowLiqMarket: CandidateMarket = {
        ...mockMarket,
        metrics: {
          ...mockMarket.metrics,
          liquidityDepthUsdc: 20000, // Below $50,000 policy
        },
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        lowLiqMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_LOW_LIQUIDITY);
    });

    test("Extreme Volatility Ceiling should veto trade if 1h realized volatility > 6%", () => {
      const extremeVolMarket: CandidateMarket = {
        ...mockMarket,
        metrics: {
          ...mockMarket.metrics,
          realizedVolatility1hPct: 8.5, // > 6.0%
        },
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        validDecision,
        extremeVolMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(false);
      expect(res.reasonCode).toBe(REJECTION_REASONS.RISK_HIGH_VOLATILITY);
    });

    test("Position Sizing should automatically clamp excessive requested size", () => {
      const oversizedDecision: NexoraTradeDecision = {
        ...validDecision,
        positionSizePercent: 10.0, // Requested 10% ($1,000), policy allows max 5% ($500)
      };

      const res = DeterministicRiskEngine.validateTradeProposal(
        oversizedDecision,
        mockMarket,
        mockPortfolio,
        defaultPolicy,
        0
      );

      expect(res.approved).toBe(true);
      expect(res.clampedSizeUsdc).toBe(500.0); // Clamped to 5% ($500)
    });
  });
});
