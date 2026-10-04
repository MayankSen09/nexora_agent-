import {
  AgentState,
  AgentTelemetry,
  CandidateMarket,
  ExecutionEnvironment,
  Position,
  PROTOCOL_CONSTANTS,
  RiskPolicyConfig,
} from "@nexora/shared";
import { db } from "@nexora/database";
import { MarketDataProvider } from "@nexora/data";
import { ExecutionProvider } from "@nexora/execution";
import { AIProvider, AgentConfig, CycleExecutionResult } from "./types.js";
import { MockAIProvider } from "./ai/mock.js";
import { MarketDiscovery } from "./modules/market-discovery.js";
import { MarketAnalyst } from "./modules/market-analyst.js";
import { SignalEngine } from "./modules/signal-engine.js";
import { OpportunityScorer } from "./modules/opportunity-scorer.js";
import { DecisionEngine } from "./modules/decision-engine.js";
import { PositionMonitor } from "./modules/position-monitor.js";
import { ExitManager } from "./modules/exit-manager.js";
import { PerformanceAnalyzer } from "./modules/performance-analyzer.js";

export class AgentController {
  private static instance: AgentController;

  private config: Required<AgentConfig>;
  private riskPolicy: RiskPolicyConfig;
  private isRunning = false;
  private cycleTimer?: NodeJS.Timeout;
  private currentCycle = 0;

  // Submodules
  public discovery: MarketDiscovery;
  public analyst: MarketAnalyst;
  public signalEngine: SignalEngine;
  public decisionEngine: DecisionEngine;
  public positionMonitor: PositionMonitor;
  public exitManager: ExitManager;
  public performanceAnalyzer: PerformanceAnalyzer;
  private aiProvider: AIProvider;
  private dataProvider?: MarketDataProvider;
  private executionProvider?: ExecutionProvider;

  private constructor(aiProvider?: AIProvider, dataProvider?: MarketDataProvider, config: AgentConfig = {}) {
    this.config = {
      agentId: config.agentId ?? "agent-nexora-alpha-01",
      environment: config.environment ?? "DEVNET",
      cycleIntervalMs: config.cycleIntervalMs ?? 15000,
      minOpportunityScore: config.minOpportunityScore ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.SCORE_BUY_THRESHOLD,
      minConfidenceThreshold: config.minConfidenceThreshold ?? 70,
      aiTimeoutMs: config.aiTimeoutMs ?? 3000,
      maxAllowedAgeMs: config.maxAllowedAgeMs ?? 15000,
      maxOpenPositions: config.maxOpenPositions ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MAX_OPEN_POSITIONS,
      stopLossPct: config.stopLossPct ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.STOP_LOSS_DEFAULT_PCT,
      takeProfitPct: config.takeProfitPct ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.TAKE_PROFIT_1_PCT,
      trailingStopTriggerPct: config.trailingStopTriggerPct ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.TRAILING_STOP_TRIGGER_PCT,
      trailingStopDistancePct: config.trailingStopDistancePct ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.TRAILING_STOP_DISTANCE_PCT,
      maxHoldTimeMinutes: config.maxHoldTimeMinutes ?? PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MAX_HOLD_TIME_MINUTES,
    };

    this.riskPolicy = {
      maxPositionPercent: PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MAX_POSITION_PERCENT,
      maxDailyLossPercent: PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MAX_DAILY_LOSS_PERCENT,
      maxTokenExposurePercent: PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MAX_TOKEN_EXPOSURE_PERCENT,
      maxSlippagePercent: 0.5,
      maxOpenPositions: this.config.maxOpenPositions,
      minLiquidityUsd: PROTOCOL_CONSTANTS.DEFAULT_LIMITS.MIN_LIQUIDITY_USD,
      emergencyStop: false,
      whitelistedQuoteMints: [
        PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
        PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_MAINNET,
      ],
      executionMode: "DEVNET",
    };

    this.aiProvider = aiProvider ?? new MockAIProvider();
    this.dataProvider = dataProvider;

    this.discovery = new MarketDiscovery(this.dataProvider);
    this.analyst = new MarketAnalyst();
    this.signalEngine = new SignalEngine();
    this.decisionEngine = new DecisionEngine(this.aiProvider, {
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      maxAllowedAgeMs: this.config.maxAllowedAgeMs,
    });
    this.positionMonitor = new PositionMonitor();
    this.exitManager = new ExitManager();
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  public static getInstance(aiProvider?: AIProvider, dataProvider?: MarketDataProvider): AgentController {
    if (!AgentController.instance) {
      AgentController.instance = new AgentController(aiProvider, dataProvider);
    }
    return AgentController.instance;
  }

  public setAIProvider(provider: AIProvider): void {
    this.aiProvider = provider;
    this.decisionEngine.setAIProvider(provider);
  }

  public setDataProvider(provider: MarketDataProvider): void {
    this.dataProvider = provider;
    this.discovery.setDataProvider(provider);
  }

  public setExecutionProvider(provider: ExecutionProvider): void {
    this.executionProvider = provider;
  }

  public setRiskPolicy(policy: Partial<RiskPolicyConfig>): void {
    this.riskPolicy = { ...this.riskPolicy, ...policy };
  }

  public setConfig(update: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...update };
  }

  public getTelemetry(): AgentTelemetry {
    return db.agentTelemetry;
  }

  public start(env?: ExecutionEnvironment): AgentTelemetry {
    this.isRunning = true;
    const telemetry = db.startAgent(env);
    telemetry.state = "SCANNING";

    if (!this.cycleTimer) {
      this.cycleTimer = setInterval(() => {
        if (this.isRunning && !this.riskPolicy.emergencyStop) {
          this.step().catch((err) => {
            console.error(`[Agent Cycle Error]:`, err);
            db.agentTelemetry.state = "ERROR";
          });
        }
      }, this.config.cycleIntervalMs);
    }

    return telemetry;
  }

  public pause(reason = "MANUAL_USER_PAUSE", panicLiquidate = false): AgentTelemetry {
    this.isRunning = false;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = undefined;
    }
    this.riskPolicy.emergencyStop = true;
    const telemetry = db.pauseAgent(reason, panicLiquidate);

    if (panicLiquidate) {
      const openPositions = this.positionMonitor.getOpenPositions();
      for (const pos of openPositions) {
        this.exitManager.closePosition(pos.id, "MANUAL_PANIC");
      }
    }

    return telemetry;
  }

  /**
   * Executes a single atomic agent cycle through all 9 states:
   * IDLE -> SCANNING -> ANALYZING -> DECISION -> RISK_CHECK -> EXECUTION -> MONITORING -> EXITING -> SCANNING
   */
  public async step(marketAddressesToScan: string[] = []): Promise<CycleExecutionResult> {
    this.currentCycle++;
    const now = new Date().toISOString();
    const cycleNum = this.currentCycle;
    db.agentTelemetry.currentCycle = cycleNum;

    // 0. Check Kill Switch
    if (this.riskPolicy.emergencyStop || db.agentTelemetry.emergencyStopped) {
      db.agentTelemetry.state = "PAUSED";
      return {
        cycleNumber: cycleNum,
        timestamp: now,
        state: "PAUSED",
        resultingAction: "SKIPPED",
        rejectionReason: "RISK_KILL_SWITCH_ACTIVE",
      };
    }

    // 1. MONITORING & EXITING Phase (Process existing open positions first)
    db.agentTelemetry.state = "MONITORING";
    const openPositions = this.positionMonitor.getOpenPositions();
    db.agentTelemetry.activePositionsCount = openPositions.length;

    for (const pos of openPositions) {
      const exitCheck = this.exitManager.evaluateExit(pos, this.config.maxHoldTimeMinutes);
      if (exitCheck.shouldExit && exitCheck.reason) {
        db.agentTelemetry.state = "EXITING";
        this.exitManager.closePosition(pos.id, exitCheck.reason, pos.currentPriceUsdc);
      }
    }

    // 2. SCANNING Phase (Market Discovery)
    db.agentTelemetry.state = "SCANNING";
    const discoveryStart = Date.now();
    const candidateMarkets = await this.discovery.discoverCandidates(marketAddressesToScan, {
      maxAllowedAgeMs: this.config.maxAllowedAgeMs,
    });
    db.agentTelemetry.submoduleLatencies.discoveryMs = Date.now() - discoveryStart;

    if (candidateMarkets.length === 0) {
      db.agentTelemetry.state = "IDLE";
      return {
        cycleNumber: cycleNum,
        timestamp: now,
        state: "IDLE",
        resultingAction: "SKIPPED",
        errorMessage: "No tradeable candidate markets discovered meeting liquidity and freshness requirements.",
      };
    }

    // 3. ANALYZING Phase (Market Analysis, Signals & Opportunity Scoring)
    db.agentTelemetry.state = "ANALYZING";
    const featuresStart = Date.now();
    const scoredCandidates = OpportunityScorer.rankOpportunities(
      candidateMarkets,
      this.config.minOpportunityScore
    );
    db.agentTelemetry.submoduleLatencies.featuresMs = Date.now() - featuresStart;

    if (scoredCandidates.length === 0) {
      db.agentTelemetry.state = "IDLE";
      return {
        cycleNumber: cycleNum,
        timestamp: now,
        state: "IDLE",
        resultingAction: "SKIPPED",
        errorMessage: `Discovered markets scored below minimum buy threshold (${this.config.minOpportunityScore}/100).`,
      };
    }

    // Select Top Opportunity
    const topOpportunity = scoredCandidates[0];
    const targetMarket = topOpportunity.market;
    const oppScore = topOpportunity.scoreResult.score;
    const pairSymbol = `${targetMarket.baseToken.symbol}/${targetMarket.quoteToken.symbol}`;

    db.agentTelemetry.activeFocusPair = pairSymbol;

    // Feature & Signal extraction
    const marketFeatures = this.analyst.analyze(targetMarket);
    const signals = this.signalEngine.evaluateSignals(targetMarket, marketFeatures);

    // 4. DECISION Phase (AI Reasoning with Schema Validation, Stale Check, Confidence Gating)
    db.agentTelemetry.state = "ANALYZING";
    const aiStart = Date.now();
    const decisionResult = await this.decisionEngine.evaluate(
      targetMarket,
      signals,
      oppScore,
      db.portfolio,
      this.riskPolicy,
      db.positions.size
    );
    db.agentTelemetry.submoduleLatencies.inferenceMs = Date.now() - aiStart;
    db.agentTelemetry.lastDecisionTime = now;

    // 5. RISK_CHECK Phase
    db.agentTelemetry.state = "WAITING_FOR_RISK";
    db.agentTelemetry.submoduleLatencies.riskEngineMs = 2;

    if (!decisionResult.isExecutable) {
      db.agentTelemetry.state = "IDLE";
      const resultingAction = decisionResult.decision.action === "HOLD" ? "HELD" : "AVOIDED";
      return {
        cycleNumber: cycleNum,
        timestamp: now,
        state: "IDLE",
        focusMarketAddress: targetMarket.address,
        focusPairSymbol: pairSymbol,
        opportunityScore: oppScore,
        aiDecision: decisionResult.decision,
        riskVerdict: decisionResult.riskValidation.approved ? "APPROVED" : "REJECTED",
        rejectionReason: decisionResult.riskValidation.reasonMessage || decisionResult.decision.invalidationReason,
        resultingAction,
      };
    }

    // 6. EXECUTION Phase (Deterministic Position Placement)
    db.agentTelemetry.state = "EXECUTING";
    const simulationStart = Date.now();
    const positionSizeUsdc = decisionResult.riskValidation.clampedSizeUsdc ?? 100.0;
    const entryPrice = targetMarket.metrics.priceUsdc;
    const sizeUnits = Math.round((positionSizeUsdc / entryPrice) * 1000) / 1000;

    const stopLossPrice = Math.round(entryPrice * (1 - this.config.stopLossPct / 100) * 100) / 100;
    const takeProfitPrice = Math.round(entryPrice * (1 + this.config.takeProfitPct / 100) * 100) / 100;
    const trailingStopPrice = stopLossPrice;

    const newPosition: Position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pairAddress: targetMarket.address,
      pairSymbol,
      baseMint: targetMarket.baseToken.mint,
      quoteMint: targetMarket.quoteToken.mint,
      direction: "LONG",
      entryPriceUsdc: entryPrice,
      currentPriceUsdc: entryPrice,
      sizeUnits,
      sizeUsdc: positionSizeUsdc,
      unrealizedPnlUsdc: 0,
      unrealizedPnlPct: 0,
      takeProfitPriceUsdc: takeProfitPrice,
      stopLossPriceUsdc: stopLossPrice,
      trailingStopPriceUsdc: trailingStopPrice,
      peakPriceUsdc: entryPrice,
      status: "OPEN",
      openedAt: now,
      updatedAt: now,
    };

    db.positions.set(newPosition.id, newPosition);
    db.portfolio.allocatedCapitalUsdc += positionSizeUsdc;
    db.portfolio.freeCashUsdc = Math.max(0, db.portfolio.freeCashUsdc - positionSizeUsdc);
    db.portfolio.totalEquityUsdc = db.portfolio.freeCashUsdc + db.portfolio.allocatedCapitalUsdc;
    db.agentTelemetry.deployedCapitalUsdc = db.portfolio.allocatedCapitalUsdc;
    db.agentTelemetry.activePositionsCount = db.positions.size;
    db.agentTelemetry.submoduleLatencies.simulationMs = Date.now() - simulationStart;

    const txSignature = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    decisionResult.record.txSignature = txSignature;

    db.agentTelemetry.state = "MONITORING";

    return {
      cycleNumber: cycleNum,
      timestamp: now,
      state: "MONITORING",
      focusMarketAddress: targetMarket.address,
      focusPairSymbol: pairSymbol,
      opportunityScore: oppScore,
      aiDecision: decisionResult.decision,
      riskVerdict: "APPROVED",
      resultingAction: "EXECUTED_ENTRY",
      executedPositionId: newPosition.id,
      clampedSizeUsdc: positionSizeUsdc,
      txSignature,
    };
  }
}

export const agent = AgentController.getInstance();
