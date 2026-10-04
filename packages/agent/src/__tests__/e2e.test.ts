import { describe, test, expect, beforeEach } from "bun:test";
import {
  AgentController,
  MockAIProvider,
  PositionMonitor,
  ExitManager,
} from "../index.js";
import { MockMarketDataProvider } from "@nexora/data";
import { db } from "@nexora/database";
import { PROTOCOL_CONSTANTS } from "@nexora/shared";

describe("NEXORA Full End-to-End Autonomous Lifecycle (@nexora/agent)", () => {
  let mockAI: MockAIProvider;
  let mockData: MockMarketDataProvider;
  let agentController: AgentController;

  beforeEach(() => {
    // 1. Reset Database and Portfolio
    db.positions.clear();
    db.decisions = [];
    db.trades = [];
    db.portfolio.freeCashUsdc = 10000.0;
    db.portfolio.allocatedCapitalUsdc = 0.0;
    db.portfolio.totalEquityUsdc = 10000.0;
    db.portfolio.realizedPnl24hUsdc = 0.0;
    db.portfolio.unrealizedPnlUsdc = 0.0;

    mockAI = new MockAIProvider({
      defaultAction: "BUY",
      confidence: 88,
      positionSizePercent: 5.0,
    });
    mockData = new MockMarketDataProvider();

    agentController = AgentController.getInstance(mockAI, mockData);
    agentController.setAIProvider(mockAI);
    agentController.setDataProvider(mockData);
    agentController.setRiskPolicy({
      maxPositionPercent: 5.0,
      maxDailyLossPercent: 3.0,
      maxTokenExposurePercent: 10.0,
      maxSlippagePercent: 0.5,
      maxOpenPositions: 3,
      minLiquidityUsd: 50000,
      emergencyStop: false,
      whitelistedQuoteMints: [PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET],
      executionMode: "DEVNET",
    });
  });

  test("Complete 10-Step Lifecycle: User Start -> Discovery -> Analysis -> Decision -> Risk -> Simulation -> Execution -> Position -> Monitoring -> Exit", async () => {
    // -------------------------------------------------------------
    // Step 1: User Starts Agent
    // -------------------------------------------------------------
    const startTelemetry = agentController.start("DEVNET");
    expect(startTelemetry.state).toBe("SCANNING");

    // -------------------------------------------------------------
    // Step 2 & 3: Market Discovery & Microstructure Analysis
    // -------------------------------------------------------------
    // Execute a full atomic autonomous trading cycle
    const cycleResult = await agentController.step();
    expect(cycleResult.state).toBeDefined();

    // -------------------------------------------------------------
    // Step 4 & 5: AI Decision & Risk Invariant Validation
    // -------------------------------------------------------------
    expect(db.decisions.length).toBeGreaterThanOrEqual(1);
    const latestDecision = db.decisions[0];
    expect(latestDecision.decision.action).toBe("BUY");
    expect(latestDecision.decision.confidence).toBe(88);
    expect(latestDecision.riskVerdict).toBe("APPROVED");

    // -------------------------------------------------------------
    // Step 6 & 7: Pre-Flight Simulation & DEX Swap Execution
    // -------------------------------------------------------------
    // Verify an onchain position was opened
    const activePositions = Array.from(db.positions.values()).filter((p) => p.status === "OPEN");
    expect(activePositions.length).toBe(1);

    const openPosition = activePositions[0];
    expect(openPosition.pairSymbol).toBe("SOL/USDC");
    expect(openPosition.sizeUsdc).toBe(500.0); // 5% of $10,000
    expect(openPosition.status).toBe("OPEN");
    expect(db.portfolio.allocatedCapitalUsdc).toBe(500.0);
    expect(db.portfolio.freeCashUsdc).toBe(9500.0);

    // -------------------------------------------------------------
    // Step 8 & 9: Position Monitoring & Trailing Stop Updates
    // -------------------------------------------------------------
    const monitor = new PositionMonitor();

    // Price appreciates: SOL rises from $150 to $162 (+8.0%)
    const updatedPosition = monitor.updatePositionPrice(openPosition.id, 162.0, 2.0);
    expect(updatedPosition).toBeDefined();
    expect(updatedPosition!.unrealizedPnlUsdc).toBeGreaterThan(0);
    expect(updatedPosition!.unrealizedPnlPct).toBe(8.0);
    expect(updatedPosition!.trailingStopPriceUsdc).toBeGreaterThan(openPosition.stopLossPriceUsdc);

    // -------------------------------------------------------------
    // Step 10: Exit Execution (Take-Profit Scale-Out)
    // -------------------------------------------------------------
    const exitManager = new ExitManager();
    // Simulate price reaching Take Profit ($165.00)
    monitor.updatePositionPrice(openPosition.id, 165.0);
    const targetPosition = db.positions.get(openPosition.id)!;

    const exitCheck = exitManager.evaluateExit(targetPosition, 45);
    expect(exitCheck.shouldExit).toBe(true);
    expect(exitCheck.reason).toBe("TAKE_PROFIT_1");

    // Process Exit Unwind
    const closedTrade = exitManager.closePosition(openPosition.id, "TAKE_PROFIT_1", 165.0);
    expect(closedTrade).toBeDefined();
    expect(closedTrade!.side).toBe("SELL");
    expect(closedTrade!.realizedPnlUsdc).toBe(50.0); // ($165 - $150) / $150 * $500 = +$50
    expect(closedTrade!.realizedPnlPct).toBe(10.0);

    // Verify post-exit state
    const finalPosition = db.positions.get(openPosition.id)!;
    expect(finalPosition.status).toBe("CLOSED");
    expect(db.portfolio.allocatedCapitalUsdc).toBe(0);
    expect(db.portfolio.freeCashUsdc).toBe(10050.0);
    expect(db.portfolio.totalEquityUsdc).toBe(10050.0);
  });
});
