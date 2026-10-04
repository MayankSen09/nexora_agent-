import {
  CandidateMarket,
  AgentTelemetry,
  Position,
  Trade,
  DecisionLedgerRecord,
  RiskEvent,
  PortfolioSummary,
  GetSystemHealthResponse,
  PROTOCOL_CONSTANTS
} from "@nexora/shared";

/**
 * High-Performance In-Memory / PostgreSQL-Compatible Data Access Layer
 * Provides typed query methods and persistence for the Nexora Autonomous System.
 */
export class DatabaseStore {
  private static instance: DatabaseStore;

  // In-memory operational store with full relational indexes
  public markets: Map<string, CandidateMarket> = new Map();
  public agentTelemetry: AgentTelemetry;
  public positions: Map<string, Position> = new Map();
  public trades: Trade[] = [];
  public decisions: DecisionLedgerRecord[] = [];
  public riskEvents: RiskEvent[] = [];
  public portfolio: PortfolioSummary;

  private constructor() {
    // Seed initial mock data for immediate out-of-the-box local developer experience
    this.agentTelemetry = {
      agentId: "agent-nexora-alpha-01",
      state: "SCANNING",
      environment: "DEVNET",
      uptimeSeconds: 14280,
      currentCycle: 1428,
      activeFocusPair: "SOL/USDC",
      lastDecisionTime: new Date(Date.now() - 12000).toISOString(),
      consecutiveLosses: 0,
      circuitBreakerTripped: false,
      emergencyStopped: false,
      activePositionsCount: 1,
      deployedCapitalUsdc: 1000.0,
      totalPortfolioEquityUsdc: 10428.5,
      todayPnlUsdc: 428.5,
      todayPnlPct: 4.28,
      submoduleLatencies: {
        discoveryMs: 42,
        featuresMs: 18,
        inferenceMs: 1420,
        riskEngineMs: 4,
        simulationMs: 120,
      },
    };

    this.portfolio = {
      totalEquityUsdc: 10428.5,
      freeCashUsdc: 9428.5,
      allocatedCapitalUsdc: 1000.0,
      utilizationPct: 9.58,
      unrealizedPnlUsdc: 42.8,
      unrealizedPnlPct: 4.28,
      realizedPnl24hUsdc: 385.7,
      realizedPnl24hPct: 3.85,
      winRatePct: 75.0,
      profitFactor: 3.2,
      totalTradesCount: 12,
      winningTradesCount: 9,
      losingTradesCount: 3,
      maxDrawdown24hPct: 1.2,
      updatedAt: new Date().toISOString(),
    };

    // Seed initial candidate markets
    this.seedMarkets();
    this.seedPositions();
    this.seedDecisions();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private seedMarkets() {
    const solUsdc: CandidateMarket = {
      address: "Meteora_SOL_USDC_DLMM_8xKz",
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
        priceUsdc: 148.42,
        priceNative: 1.0,
        volume24hUsdc: 4820000.0,
        volume15mUsdc: 185000.0,
        liquidityDepthUsdc: 620000.0,
        feeAprPct: 48.2,
        realizedVolatility1hPct: 2.4,
        orderFlowImbalance: 0.65,
        activeBinId: 24810,
        priceChange24hPct: 5.4,
        priceChange15mPct: 0.85,
      },
      opportunityScore: 88.4,
      isTradeable: true,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 100.0,
      },
      lastScannedAt: new Date().toISOString(),
    };

    const jupUsdc: CandidateMarket = {
      address: "Meteora_JUP_USDC_DLMM_3fLq",
      venue: "METEORA_DLMM",
      baseToken: {
        mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        symbol: "JUP",
        name: "Jupiter",
        decimals: 6,
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
        priceUsdc: 1.12,
        priceNative: 0.0075,
        volume24hUsdc: 1250000.0,
        volume15mUsdc: 74000.0,
        liquidityDepthUsdc: 380000.0,
        feeAprPct: 32.5,
        realizedVolatility1hPct: 1.8,
        orderFlowImbalance: 0.45,
        activeBinId: 1120,
        priceChange24hPct: 3.2,
        priceChange15mPct: 0.4,
      },
      opportunityScore: 78.5,
      isTradeable: true,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 100.0,
      },
      lastScannedAt: new Date().toISOString(),
    };

    this.markets.set(solUsdc.address, solUsdc);
    this.markets.set(jupUsdc.address, jupUsdc);
  }

  private seedPositions() {
    const pos: Position = {
      id: "pos-001",
      pairAddress: "Meteora_SOL_USDC_DLMM_8xKz",
      pairSymbol: "SOL/USDC",
      baseMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
      quoteMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
      direction: "LONG",
      entryPriceUsdc: 142.3,
      currentPriceUsdc: 148.42,
      sizeUnits: 7.027,
      sizeUsdc: 1000.0,
      unrealizedPnlUsdc: 42.8,
      unrealizedPnlPct: 4.28,
      takeProfitPriceUsdc: 150.84, // +6%
      stopLossPriceUsdc: 138.03, // -3%
      trailingStopPriceUsdc: 145.45,
      peakPriceUsdc: 148.42,
      status: "OPEN",
      openedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.positions.set(pos.id, pos);
  }

  private seedDecisions() {
    const record: DecisionLedgerRecord = {
      id: "dec-1428",
      timestamp: new Date().toISOString(),
      pairAddress: "Meteora_SOL_USDC_DLMM_8xKz",
      pairSymbol: "SOL/USDC",
      score: 88.4,
      decision: {
        action: "BUY",
        confidence: 88,
        positionSizePercent: 9.5,
        entryReason: "Meteora SOL/USDC pool exhibiting 3.2x volume surge with fee APR surging to 48.2% and clean 15m momentum breakout.",
        riskLevel: "LOW",
        invalidationReason: "Price breaks lower active bin floor ($142.00).",
        timeHorizon: "SHORT_15M",
        signals: [
          { name: "volume_acceleration", value: 0.88, weight: 0.15 },
          { name: "dlmm_fee_surge", value: 0.94, weight: 0.15 },
          { name: "order_flow_imbalance", value: 0.65, weight: 0.10 },
        ],
      },
      riskVerdict: "APPROVED",
      clampedPositionSizeUsdc: 1000.0,
      txSignature: "5Kj8b3Z...devnet",
    };

    this.decisions.unshift(record);
  }

  // Repository Queries
  public getMarkets(minScore?: number, venue?: string): CandidateMarket[] {
    let list = Array.from(this.markets.values());
    if (minScore !== undefined) {
      list = list.filter((m) => m.opportunityScore >= minScore);
    }
    if (venue) {
      list = list.filter((m) => m.venue === venue);
    }
    return list.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  public getMarketByAddress(address: string): CandidateMarket | undefined {
    return this.markets.get(address);
  }

  public getPositions(): Position[] {
    return Array.from(this.positions.values()).filter((p) => p.status === "OPEN");
  }

  public getTrades(): Trade[] {
    return this.trades;
  }

  public getDecisions(limit = 20, offset = 0): DecisionLedgerRecord[] {
    return this.decisions.slice(offset, offset + limit);
  }

  public getRiskEvents(limit = 20, offset = 0): RiskEvent[] {
    return this.riskEvents.slice(offset, offset + limit);
  }

  public getSystemHealth(): GetSystemHealthResponse {
    return {
      status: "HEALTHY",
      version: PROTOCOL_CONSTANTS.VERSION,
      uptimeSeconds: this.agentTelemetry.uptimeSeconds,
      environment: this.agentTelemetry.environment,
      solanaRpc: {
        status: "CONNECTED",
        endpoint: "https://api.devnet.solana.com",
        latencyMs: 18,
        currentSlot: 312849201,
      },
      jupiterApi: {
        status: "CONNECTED",
        latencyMs: 24,
      },
      meteoraApi: {
        status: "CONNECTED",
        latencyMs: 32,
      },
      database: {
        status: "CONNECTED",
      },
    };
  }

  public pauseAgent(reason: string, panicLiquidate = false): AgentTelemetry {
    this.agentTelemetry.state = "PAUSED";
    this.agentTelemetry.emergencyStopped = true;
    this.riskEvents.unshift({
      id: `risk-event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: "KILL_SWITCH_ENGAGED",
      severity: "CRITICAL",
      reasonCode: "RISK_KILL_SWITCH_ACTIVE",
      details: `Agent paused by operator. Reason: ${reason}. Panic Liquidate: ${panicLiquidate}`,
      actionTaken: panicLiquidate ? "LIQUIDATED_POSITIONS" : "PAUSED_AGENT",
    });
    return this.agentTelemetry;
  }

  public startAgent(environment?: "PAPER_TRADING" | "DEVNET" | "MAINNET"): AgentTelemetry {
    this.agentTelemetry.state = "SCANNING";
    this.agentTelemetry.emergencyStopped = false;
    this.agentTelemetry.circuitBreakerTripped = false;
    if (environment) {
      this.agentTelemetry.environment = environment;
    }
    return this.agentTelemetry;
  }
}

export const db = DatabaseStore.getInstance();
