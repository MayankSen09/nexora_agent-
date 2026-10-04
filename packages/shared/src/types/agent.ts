export type AgentState =
  | "IDLE"
  | "SCANNING"
  | "ANALYZING"
  | "WAITING_FOR_RISK"
  | "EXECUTING"
  | "MONITORING"
  | "EXITING"
  | "PAUSED"
  | "ERROR";

export type ExecutionEnvironment = "PAPER_TRADING" | "DEVNET" | "MAINNET";

export interface AgentTelemetry {
  agentId: string;
  state: AgentState;
  environment: ExecutionEnvironment;
  uptimeSeconds: number;
  currentCycle: number;
  activeFocusPair?: string;
  lastDecisionTime?: string;
  consecutiveLosses: number;
  circuitBreakerTripped: boolean;
  emergencyStopped: boolean;
  activePositionsCount: number;
  deployedCapitalUsdc: number;
  totalPortfolioEquityUsdc: number;
  todayPnlUsdc: number;
  todayPnlPct: number;
  submoduleLatencies: {
    discoveryMs: number;
    featuresMs: number;
    inferenceMs: number;
    riskEngineMs: number;
    simulationMs: number;
  };
}
