import {
  CandidateMarket,
  DecisionSignal,
  NexoraTradeDecision,
  PortfolioSummary,
  RiskPolicyConfig,
  AgentState,
  ExecutionEnvironment,
} from "@nexora/shared";

export interface MarketAnalysisContext {
  market: CandidateMarket;
  signals: DecisionSignal[];
  opportunityScore: number;
  portfolio: PortfolioSummary;
  riskPolicy: RiskPolicyConfig;
  activePositionsCount: number;
  timestamp: string;
}

export interface AIProvider {
  readonly name: string;
  analyzeMarket(context: MarketAnalysisContext): Promise<NexoraTradeDecision>;
}

export interface AgentConfig {
  agentId?: string;
  environment?: ExecutionEnvironment;
  cycleIntervalMs?: number;
  minOpportunityScore?: number;
  minConfidenceThreshold?: number;
  aiTimeoutMs?: number;
  maxAllowedAgeMs?: number;
  maxOpenPositions?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
  trailingStopTriggerPct?: number;
  trailingStopDistancePct?: number;
  maxHoldTimeMinutes?: number;
}

export interface CycleExecutionResult {
  cycleNumber: number;
  timestamp: string;
  state: AgentState;
  focusMarketAddress?: string;
  focusPairSymbol?: string;
  opportunityScore?: number;
  aiDecision?: NexoraTradeDecision;
  riskVerdict?: "APPROVED" | "REJECTED" | "SKIPPED";
  rejectionReason?: string;
  resultingAction: "EXECUTED_ENTRY" | "EXECUTED_EXIT" | "HELD" | "AVOIDED" | "SKIPPED";
  executedPositionId?: string;
  clampedSizeUsdc?: number;
  txSignature?: string;
  errorMessage?: string;
}
