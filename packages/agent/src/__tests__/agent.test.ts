import { describe, test, expect, beforeEach } from "bun:test";
import {
  AgentController,
  MockAIProvider,
  MarketDiscovery,
  MarketAnalyst,
  SignalEngine,
  OpportunityScorer,
  DecisionEngine,
  PositionMonitor,
  ExitManager,
  PerformanceAnalyzer,
} from "../index.js";
import { MockMarketDataProvider } from "@nexora/data";
import { db } from "@nexora/database";
import { CandidateMarket, PROTOCOL_CONSTANTS } from "@nexora/shared";

describe("NEXORA Autonomous Agent Pipeline (@nexora/agent)", () => {
  let mockAI: MockAIProvider;
  let mockData: MockMarketDataProvider;
  let agentController: AgentController;

  const createFreshMarket = (address = "Meteora_SOL_USDC_DLMM_Test", price = 150.0): CandidateMarket => ({
    address,
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
      priceUsdc: price,
      priceNative: 1.0,
      volume24hUsdc: 5000000,
      volume15mUsdc: 200000,
      liquidityDepthUsdc: 600000,
      feeAprPct: 45.0,
      realizedVolatility1hPct: 2.2,
      orderFlowImbalance: 0.60,
      activeBinId: 25000,
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
  });

  beforeEach(() => {
    // Reset DB state
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
    agentController = AgentController.getInstance(mockAI, mockData);
    agentController.setAIProvider(mockAI);
    agentController.setDataProvider(mockData);
    agentController.setRiskPolicy({ emergencyStop: false });
  });

  describe("1. Specialized Modules Unit Testing", () => {
    test("MarketAnalyst should extract quantitative microstructure features", () => {
      const analyst = new MarketAnalyst();
      const market = createFreshMarket();
      const features = analyst.analyze(market);

      expect(features.marketAddress).toBe(market.address);
      expect(features.volumeAccelerationRatio).toBeGreaterThan(0);
      expect(features.volatilityRegime).toBe("NORMAL");
      expect(features.orderFlowBias).toBe("STRONG_BUY");
      expect(features.liquidityTier).toBe("DEEP");
    });

    test("SignalEngine should compute normalized signal vector", () => {
      const analyst = new MarketAnalyst();
      const signalEngine = new SignalEngine();
      const market = createFreshMarket();
      const features = analyst.analyze(market);
      const signals = signalEngine.evaluateSignals(market, features);

      expect(signals.length).toBeGreaterThanOrEqual(5);
      const volSig = signals.find((s) => s.name === "volume_acceleration");
      expect(volSig).toBeDefined();
      expect(volSig!.value).toBeGreaterThanOrEqual(0);
      expect(volSig!.value).toBeLessThanOrEqual(1.0);
    });

    test("OpportunityScorer should compute composite score and rank opportunities", () => {
      const m1 = createFreshMarket("Pair_1", 100);
      const m2 = createFreshMarket("Pair_2", 200);
      m2.metrics.feeAprPct = 10.0;
      m2.metrics.volume15mUsdc = 5000;

      const ranked = OpportunityScorer.rankOpportunities([m1, m2], 60.0);
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].market.address).toBe("Pair_1");
    });
  });

  describe("2. Fail-Closed Rules: The 4 'DO NOT TRADE' Invariants", () => {
    test("Rule 1: If AI output is invalid -> DO NOT TRADE", async () => {
      mockAI.setConfig({ returnInvalidSchema: true });
      const market = createFreshMarket();
      db.markets.set(market.address, market);

      const result = await agentController.step([market.address]);
      expect(result.resultingAction).toBe("AVOIDED");
      expect(result.riskVerdict).toBe("REJECTED");
      expect(db.positions.size).toBe(0);

      // Verify persisted in decision ledger
      expect(db.decisions.length).toBeGreaterThan(0);
      expect(db.decisions[0].rejectionReason).toContain("INVALID_AI_SCHEMA");
    });

    test("Rule 2: If confidence is below configured threshold -> DO NOT TRADE", async () => {
      mockAI.setConfig({ confidence: 55 }); // Below 70% threshold
      const market = createFreshMarket();
      db.markets.set(market.address, market);

      const result = await agentController.step([market.address]);
      expect(result.resultingAction).toBe("AVOIDED");
      expect(result.riskVerdict).toBe("REJECTED");
      expect(db.positions.size).toBe(0);

      // Verify persisted in decision ledger
      expect(db.decisions.length).toBeGreaterThan(0);
      expect(db.decisions[0].decision.action).toBe("AVOID");
      expect(db.decisions[0].rejectionReason).toContain("LOW_CONFIDENCE");
    });

    test("Rule 3: If data is stale -> DO NOT TRADE", async () => {
      // Create market with 30s old timestamp
      const staleMarket = createFreshMarket();
      staleMarket.lastScannedAt = new Date(Date.now() - 30000).toISOString();
      db.markets.set(staleMarket.address, staleMarket);

      const result = await agentController.step([staleMarket.address]);
      expect(result.resultingAction).toBe("AVOIDED");
      expect(result.riskVerdict).toBe("REJECTED");
      expect(db.positions.size).toBe(0);

      expect(db.decisions.length).toBeGreaterThan(0);
      expect(db.decisions[0].decision.entryReason).toContain("STALE_DATA_REJECTION");
    });

    test("Rule 4: If Risk Engine rejects -> DO NOT TRADE", async () => {
      const unsafeMarket = createFreshMarket();
      unsafeMarket.metrics.realizedVolatility1hPct = 7.5; // Exceeds 6.0% risk engine limit
      db.markets.set(unsafeMarket.address, unsafeMarket);

      const result = await agentController.step([unsafeMarket.address]);
      expect(result.resultingAction).toBe("AVOIDED");
      expect(result.riskVerdict).toBe("REJECTED");
      expect(db.positions.size).toBe(0);

      expect(db.decisions.length).toBeGreaterThan(0);
      expect(db.decisions[0].riskVerdict).toBe("REJECTED");
      expect(db.decisions[0].rejectionReason).toBe("RISK_HIGH_VOLATILITY");
    });
  });

  describe("3. Full Autonomous Lifecycle & Execution Flow", () => {
    test("should execute BUY entry when all signals, AI reasoning, and risk checks pass", async () => {
      const freshMarket = createFreshMarket();
      db.markets.set(freshMarket.address, freshMarket);

      const result = await agentController.step([freshMarket.address]);
      expect(result.resultingAction).toBe("EXECUTED_ENTRY");
      expect(result.riskVerdict).toBe("APPROVED");
      expect(result.executedPositionId).toBeDefined();
      expect(result.clampedSizeUsdc).toBeGreaterThan(0);

      // Verify position recorded in DB
      expect(db.positions.size).toBe(1);
      const position = db.positions.get(result.executedPositionId!);
      expect(position).toBeDefined();
      expect(position!.status).toBe("OPEN");
      expect(position!.entryPriceUsdc).toBe(150.0);
      expect(position!.stopLossPriceUsdc).toBeLessThan(150.0);
      expect(position!.takeProfitPriceUsdc).toBeGreaterThan(150.0);

      // Verify decision ledger persisted with complete audit metadata
      expect(db.decisions.length).toBeGreaterThan(0);
      const decisionLog = db.decisions[0];
      expect(decisionLog.timestamp).toBeDefined();
      expect(decisionLog.pairAddress).toBe(freshMarket.address);
      expect(decisionLog.decision.action).toBe("BUY");
      expect(decisionLog.decision.confidence).toBe(88);
      expect(decisionLog.decision.signals.length).toBeGreaterThan(0);
      expect(decisionLog.decision.entryReason).toBeDefined();
      expect(decisionLog.decision.invalidationReason).toBeDefined();
      expect(decisionLog.riskVerdict).toBe("APPROVED");
    });
  });

  describe("4. Position Monitor & Deterministic Exit Management", () => {
    let testPositionId: string;

    beforeEach(() => {
      const pos = {
        id: "test-pos-01",
        pairAddress: "SOL_USDC",
        pairSymbol: "SOL/USDC",
        baseMint: "SOL",
        quoteMint: "USDC",
        direction: "LONG" as const,
        entryPriceUsdc: 100.0,
        currentPriceUsdc: 100.0,
        sizeUnits: 5.0,
        sizeUsdc: 500.0,
        unrealizedPnlUsdc: 0,
        unrealizedPnlPct: 0,
        takeProfitPriceUsdc: 106.0, // +6%
        stopLossPriceUsdc: 97.0, // -3%
        trailingStopPriceUsdc: 97.0,
        peakPriceUsdc: 100.0,
        status: "OPEN" as const,
        openedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.positions.set(pos.id, pos);
      testPositionId = pos.id;
    });

    test("PositionMonitor should update mark-to-market PnL and advance trailing stop", () => {
      const monitor = new PositionMonitor();
      const updated = monitor.updatePositionPrice(testPositionId, 105.0, 2.0);

      expect(updated).toBeDefined();
      expect(updated!.unrealizedPnlPct).toBe(5.0);
      expect(updated!.unrealizedPnlUsdc).toBe(25.0);
      expect(updated!.peakPriceUsdc).toBe(105.0);
      expect(updated!.trailingStopPriceUsdc).toBe(102.9); // 105 * (1 - 0.02)
    });

    test("ExitManager should trigger STOP_LOSS exit when price falls below SL floor", () => {
      const monitor = new PositionMonitor();
      const exitManager = new ExitManager();

      monitor.updatePositionPrice(testPositionId, 96.5);
      const pos = db.positions.get(testPositionId)!;

      const exitEval = exitManager.evaluateExit(pos);
      expect(exitEval.shouldExit).toBe(true);
      expect(exitEval.reason).toBe("STOP_LOSS");

      const closedTrade = exitManager.closePosition(testPositionId, "STOP_LOSS", 96.5);
      expect(closedTrade).toBeDefined();
      expect(closedTrade!.realizedPnlPct).toBe(-3.5);
      expect(db.trades.length).toBe(1);
    });

    test("ExitManager should trigger TAKE_PROFIT exit when price reaches TP ceiling", () => {
      const monitor = new PositionMonitor();
      const exitManager = new ExitManager();

      monitor.updatePositionPrice(testPositionId, 107.0);
      const pos = db.positions.get(testPositionId)!;

      const exitEval = exitManager.evaluateExit(pos);
      expect(exitEval.shouldExit).toBe(true);
      expect(exitEval.reason).toBe("TAKE_PROFIT_1");

      const closedTrade = exitManager.closePosition(testPositionId, "TAKE_PROFIT_1", 107.0);
      expect(closedTrade).toBeDefined();
      expect(closedTrade!.realizedPnlPct).toBe(7.0);
      expect(closedTrade!.realizedPnlUsdc).toBe(35.0);
    });
  });

  describe("5. Performance Analyzer", () => {
    test("should accurately calculate win rate, profit factor, and Sharpe ratio", () => {
      const analyzer = new PerformanceAnalyzer();

      db.trades = [
        {
          id: "t1",
          positionId: "p1",
          pairAddress: "A",
          pairSymbol: "SOL/USDC",
          side: "SELL",
          priceUsdc: 106,
          sizeUnits: 5.0,
          sizeUsdc: 500,
          realizedPnlUsdc: 30,
          realizedPnlPct: 6.0,
          feeUsdc: 0.5,
          exitReason: "TAKE_PROFIT_1",
          txSignature: "tx1",
          executedAt: new Date().toISOString(),
        },
        {
          id: "t2",
          positionId: "p2",
          pairAddress: "A",
          pairSymbol: "SOL/USDC",
          side: "SELL",
          priceUsdc: 97,
          sizeUnits: 5.0,
          sizeUsdc: 500,
          realizedPnlUsdc: -15,
          realizedPnlPct: -3.0,
          feeUsdc: 0.5,
          exitReason: "STOP_LOSS",
          txSignature: "tx2",
          executedAt: new Date().toISOString(),
        },
      ];

      const metrics = analyzer.computeMetrics();
      expect(metrics.totalTrades).toBe(2);
      expect(metrics.winningTrades).toBe(1);
      expect(metrics.losingTrades).toBe(1);
      expect(metrics.winRatePct).toBe(50.0);
      expect(metrics.profitFactor).toBe(2.0); // 30 / 15 = 2.0
      expect(metrics.totalRealizedPnlUsdc).toBe(15.0);
    });
  });
});
