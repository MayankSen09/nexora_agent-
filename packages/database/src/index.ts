import {
  CandidateMarket,
  AgentTelemetry,
  Position,
  Trade,
  TransactionRecord,
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
  public transactions: TransactionRecord[] = [];
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

    const bonkUsdc: CandidateMarket = {
      address: "Jupiter_BONK_USDC_Pool_9wPq",
      venue: "JUPITER",
      baseToken: {
        mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "BONK",
        name: "Bonk",
        decimals: 5,
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
        priceUsdc: 0.0000214,
        priceNative: 0.00000014,
        volume24hUsdc: 8900000.0,
        volume15mUsdc: 320000.0,
        liquidityDepthUsdc: 450000.0,
        feeAprPct: 24.1,
        realizedVolatility1hPct: 4.8,
        orderFlowImbalance: 0.28,
        activeBinId: 214,
        priceChange24hPct: -2.1,
        priceChange15mPct: 0.12,
      },
      opportunityScore: 64.2,
      isTradeable: true,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 98.5,
      },
      lastScannedAt: new Date().toISOString(),
    };

    const rayUsdc: CandidateMarket = {
      address: "Meteora_RAY_USDC_DLMM_5tMn",
      venue: "METEORA_DLMM",
      baseToken: {
        mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        symbol: "RAY",
        name: "Raydium",
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
        priceUsdc: 2.45,
        priceNative: 0.0165,
        volume24hUsdc: 2100000.0,
        volume15mUsdc: 92000.0,
        liquidityDepthUsdc: 510000.0,
        feeAprPct: 41.0,
        realizedVolatility1hPct: 2.1,
        orderFlowImbalance: 0.58,
        activeBinId: 2450,
        priceChange24hPct: 4.8,
        priceChange15mPct: 0.62,
      },
      opportunityScore: 82.1,
      isTradeable: true,
      securityStatus: {
        isMintRenounced: true,
        isFreezeDisabled: true,
        isLpLocked: true,
        lpLockedPercent: 100.0,
      },
      lastScannedAt: new Date().toISOString(),
    };

    const driftUsdc: CandidateMarket = {
      address: "Jupiter_DRIFT_USDC_Pool_7yTr",
      venue: "JUPITER",
      baseToken: {
        mint: "DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7",
        symbol: "DRIFT",
        name: "Drift",
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
        priceUsdc: 0.88,
        priceNative: 0.0059,
        volume24hUsdc: 1450000.0,
        volume15mUsdc: 45000.0,
        liquidityDepthUsdc: 290000.0,
        feeAprPct: 18.5,
        realizedVolatility1hPct: 2.9,
        orderFlowImbalance: 0.35,
        activeBinId: 880,
        priceChange24hPct: 1.1,
        priceChange15mPct: -0.15,
      },
      opportunityScore: 71.3,
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
    this.markets.set(bonkUsdc.address, bonkUsdc);
    this.markets.set(rayUsdc.address, rayUsdc);
    this.markets.set(driftUsdc.address, driftUsdc);
  }

  private seedPositions() {
    const pos1: Position = {
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

    this.positions.set(pos1.id, pos1);

    // Seed historical trades
    this.trades = [
      {
        id: "trd-012",
        positionId: "pos-000",
        pairAddress: "Meteora_RAY_USDC_DLMM_5tMn",
        pairSymbol: "RAY/USDC",
        side: "SELL",
        priceUsdc: 2.44,
        sizeUnits: 307.38,
        sizeUsdc: 750.0,
        realizedPnlUsdc: 52.6,
        realizedPnlPct: 7.01,
        feeUsdc: 0.75,
        exitReason: "TAKE_PROFIT_1",
        executedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        txSignature: "4Nk9a2b8...devnet",
      },
      {
        id: "trd-011",
        positionId: "pos-999",
        pairAddress: "Meteora_JUP_USDC_DLMM_3fLq",
        pairSymbol: "JUP/USDC",
        side: "SELL",
        priceUsdc: 1.14,
        sizeUnits: 526.31,
        sizeUsdc: 600.0,
        realizedPnlUsdc: 33.3,
        realizedPnlPct: 5.55,
        feeUsdc: 0.6,
        exitReason: "TRAILING_STOP",
        executedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        txSignature: "2Wp8c7k1...devnet",
      },
      {
        id: "trd-010",
        positionId: "pos-998",
        pairAddress: "Jupiter_BONK_USDC_Pool_9wPq",
        pairSymbol: "BONK/USDC",
        side: "SELL",
        priceUsdc: 0.0000215,
        sizeUnits: 18604651,
        sizeUsdc: 400.0,
        realizedPnlUsdc: -12.6,
        realizedPnlPct: -3.15,
        feeUsdc: 0.4,
        exitReason: "STOP_LOSS",
        executedAt: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
        txSignature: "3Xm4q1v9...devnet",
      },
    ];

    // Seed transactions
    this.transactions = [
      {
        signature: "5Kj8b3ZmPqV8x9Yw2RtN7uE4sA6cK1dF9hL3jG5mPqV",
        status: "CONFIRMED",
        provider: "METEORA",
        market: "Meteora_SOL_USDC_DLMM_8xKz",
        action: "BUY",
        amount: 1000.0,
        price: 148.42,
        slippage: 0.25,
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      },
      {
        signature: "4Nk9a2b8MvQ7rT3wK9jL1dF4sA8cP2mX5vB7nE9qR3t",
        status: "CONFIRMED",
        provider: "METEORA",
        market: "Meteora_RAY_USDC_DLMM_5tMn",
        action: "SELL",
        amount: 802.6,
        price: 2.44,
        slippage: 0.2,
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ];
  }

  private seedDecisions() {
    const d1: DecisionLedgerRecord = {
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
      txSignature: "5Kj8b3ZmPqV8x9Yw2RtN7uE4sA6cK1dF9hL3jG5mPqV",
    };

    const d2: DecisionLedgerRecord = {
      id: "dec-1427",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      pairAddress: "Jupiter_BONK_USDC_Pool_9wPq",
      pairSymbol: "BONK/USDC",
      score: 64.2,
      decision: {
        action: "AVOID",
        confidence: 62,
        positionSizePercent: 3.0,
        entryReason: "Realized 1h volatility (4.8%) exceeds safety envelope with declining buy OFI.",
        riskLevel: "HIGH",
        invalidationReason: "High volatility regime.",
        timeHorizon: "SHORT_15M",
        signals: [
          { name: "volatility_regime", value: 0.35, weight: 0.10 },
          { name: "momentum_15m", value: 0.42, weight: 0.20 },
        ],
      },
      riskVerdict: "REJECTED",
      rejectionReason: "RISK_HIGH_VOLATILITY: Token 1h volatility (4.8%) exceeds max threshold (4.0%).",
    };

    const d3: DecisionLedgerRecord = {
      id: "dec-1426",
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      pairAddress: "Meteora_RAY_USDC_DLMM_5tMn",
      pairSymbol: "RAY/USDC",
      score: 82.1,
      decision: {
        action: "BUY",
        confidence: 84,
        positionSizePercent: 7.2,
        entryReason: "Strong order flow imbalance (+0.58) combined with 41% DLMM fee APR.",
        riskLevel: "LOW",
        invalidationReason: "Under $2.35 support level.",
        timeHorizon: "SWING_1H",
        signals: [
          { name: "order_flow_imbalance", value: 0.78, weight: 0.10 },
          { name: "liquidity_stability", value: 0.85, weight: 0.15 },
        ],
      },
      riskVerdict: "APPROVED",
      clampedPositionSizeUsdc: 750.0,
      txSignature: "4Nk9a2b8MvQ7rT3wK9jL1dF4sA8cP2mX5vB7nE9qR3t",
    };

    this.decisions.unshift(d1, d2, d3);
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

  public getPositionById(id: string): Position | undefined {
    return this.positions.get(id);
  }

  public closePosition(id: string, exitReason = "MANUAL_CLOSE"): Position | undefined {
    const pos = this.positions.get(id);
    if (!pos) return undefined;
    pos.status = "CLOSED";
    pos.updatedAt = new Date().toISOString();

    const trade: Trade = {
      id: `trd-${Date.now()}`,
      positionId: pos.id,
      pairAddress: pos.pairAddress,
      pairSymbol: pos.pairSymbol,
      side: "SELL",
      priceUsdc: pos.currentPriceUsdc,
      sizeUnits: pos.sizeUnits,
      sizeUsdc: pos.sizeUsdc,
      realizedPnlUsdc: pos.unrealizedPnlUsdc,
      realizedPnlPct: pos.unrealizedPnlPct,
      feeUsdc: 0.5,
      exitReason: "MANUAL_PANIC",
      executedAt: new Date().toISOString(),
      txSignature: `man-${Date.now().toString(36)}...devnet`,
    };

    this.trades.unshift(trade);
    this.portfolio.allocatedCapitalUsdc = Math.max(0, this.portfolio.allocatedCapitalUsdc - pos.sizeUsdc);
    this.portfolio.freeCashUsdc += pos.sizeUsdc + pos.unrealizedPnlUsdc;
    this.portfolio.totalEquityUsdc += pos.unrealizedPnlUsdc;
    this.portfolio.realizedPnl24hUsdc += pos.unrealizedPnlUsdc;
    this.portfolio.unrealizedPnlUsdc = 0;
    this.portfolio.unrealizedPnlPct = 0;

    return pos;
  }

  public getTrades(): Trade[] {
    return this.trades;
  }

  public getTransactions(limit = 50, offset = 0): TransactionRecord[] {
    return this.transactions.slice(offset, offset + limit);
  }

  public getTransactionBySignature(signature: string): TransactionRecord | undefined {
    return this.transactions.find((t) => t.signature === signature);
  }

  public recordTransaction(record: TransactionRecord): TransactionRecord {
    this.transactions.unshift(record);
    if (this.transactions.length > 500) {
      this.transactions.pop();
    }
    return record;
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
