import { describe, test, expect, beforeEach } from "bun:test";
import {
  AgentController,
  MockAIProvider,
  MarketDiscovery,
  MarketAnalyst,
  SignalEngine,
  DecisionEngine,
} from "../index.js";
import { MockMarketDataProvider } from "@nexora/data";
import { DeterministicRiskEngine } from "@nexora/risk-engine";
import { ExecutionPipeline, MockExecutionProvider } from "@nexora/execution";
import { SolanaTransactionBuilder, SolanaTransactionSimulator, SolanaTransactionVerifier } from "@nexora/solana";
import { db } from "@nexora/database";
import { PROTOCOL_CONSTANTS, CandidateMarket, RiskPolicyConfig } from "@nexora/shared";
import { TradeIntent } from "@nexora/execution";

describe("NEXORA Architectural Integration Suite (@nexora/agent)", () => {
  let mockAI: MockAIProvider;
  let mockData: MockMarketDataProvider;
  let mockExecution: MockExecutionProvider;
  let executionPipeline: ExecutionPipeline;

  const activePolicy: RiskPolicyConfig = {
    maxPositionPercent: 5.0,
    maxDailyLossPercent: 3.0,
    maxTokenExposurePercent: 10.0,
    maxSlippagePercent: 0.5,
    maxOpenPositions: 3,
    minLiquidityUsd: 50000,
    emergencyStop: false,
    whitelistedQuoteMints: [PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET],
    executionMode: "DEVNET",
  };

  const sampleMarket: CandidateMarket = {
    address: "Meteora_SOL_USDC_DLMM_Integration",
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
      volume15mUsdc: 250000,
      liquidityDepthUsdc: 600000,
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

  beforeEach(() => {
    db.positions.clear();
    db.decisions = [];
    db.trades = [];
    db.portfolio.freeCashUsdc = 10000;
    db.portfolio.allocatedCapitalUsdc = 0;
    db.portfolio.totalEquityUsdc = 10000;

    mockAI = new MockAIProvider({
      defaultAction: "BUY",
      confidence: 88,
      positionSizePercent: 5.0,
    });
    mockData = new MockMarketDataProvider();
    mockExecution = new MockExecutionProvider();
    executionPipeline = new ExecutionPipeline(mockExecution);
  });

  describe("Integration 1: Market Data -> Agent Discovery & Feature Analysis", () => {
    test("Market discovery should consume raw provider feeds and extract quantitative feature vectors", async () => {
      const discovery = new MarketDiscovery(mockData);
      const candidates = await discovery.discoverCandidates();
      expect(candidates.length).toBeGreaterThan(0);

      const topMarket = candidates[0];
      const analyst = new MarketAnalyst();
      const features = analyst.analyze(topMarket);

      expect(features.marketAddress).toBe(topMarket.address);
      expect(features.volumeAccelerationRatio).toBeGreaterThan(0);
      expect(features.volatilityRegime).toBe("NORMAL");

      const signalEngine = new SignalEngine();
      const signals = signalEngine.evaluateSignals(topMarket, features);
      expect(signals.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Integration 2: Agent -> Deterministic Risk Engine", () => {
    test("Agent structured decision should be evaluated by DeterministicRiskEngine with clamping", async () => {
      const decisionEngine = new DecisionEngine(mockAI);
      const decisionResult = await decisionEngine.evaluate(
        sampleMarket,
        [{ name: "vol", value: 3.2, weight: 0.2 }],
        88.0,
        db.portfolio,
        activePolicy,
        0
      );

      expect(decisionResult.decision.action).toBe("BUY");
      expect(decisionResult.decision.confidence).toBe(88);
      expect(decisionResult.riskValidation.approved).toBe(true);
      expect(decisionResult.riskValidation.clampedSizeUsdc).toBe(500.0);
    });
  });

  describe("Integration 3: Risk Engine -> Execution Pipeline", () => {
    test("ExecutionPipeline should consume TradeIntent, enforce risk approval, and dispatch to provider", async () => {
      process.env.EXECUTION_ENABLED = "true";

      const intent: TradeIntent = {
        id: "intent_integration_1",
        marketAddress: sampleMarket.address,
        pairSymbol: "SOL/USDC",
        action: "BUY",
        inputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
        outputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
        amountInUsdc: 500.0,
        amountInRaw: 500_000_000n,
        maxSlippageBps: 50,
        expectedPriceUsdc: 150.0,
        timestamp: new Date().toISOString(),
      };

      const result = await executionPipeline.processTradeIntent(intent, sampleMarket, activePolicy);

      expect(result.riskApproved).toBe(true);
      expect(result.receipt?.success).toBe(true);
      expect(result.receipt?.signature).toBeDefined();
    });
  });

  describe("Integration 4: Execution -> Solana Transaction & Simulation Layer", () => {
    test("Execution layer should build serialized transaction, simulate compute units, and verify confirmation", async () => {
      const txBuilder = new SolanaTransactionBuilder(350000, 50000);
      const compiledTx = await txBuilder.buildSwapTransaction({
        userPublicKey: "HZwX7r7eB7m9uK9c1F3dE5g7hJ9kL1mN3pQ5rS7tU9vW",
        inputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
        outputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
        amountIn: 500_000_000n, // $500 USDC
        minAmountOut: 3_250_000_000n, // 3.25 SOL
        slippageBps: 50,
      });

      expect(compiledTx).toBeDefined();
      expect(compiledTx.serialized.length).toBeGreaterThan(0);

      const simulator = new SolanaTransactionSimulator(1.0);
      const simResult = await simulator.simulate(compiledTx);
      expect(simResult.success).toBe(true);
      expect(simResult.unitsConsumed).toBeGreaterThan(0);

      const verifier = new SolanaTransactionVerifier();
      const receipt = await verifier.verifyConfirmation("5Kj8b3ZmPqV8x9Yw2RtN7uE4sA6cK1dF9hL3jG5mPqV");
      expect(receipt.confirmed).toBe(true);
      expect(receipt.slot).toBeGreaterThan(0);
    });
  });
});
