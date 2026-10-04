import { CandidateMarket } from "./market.js";
import { AgentTelemetry } from "./agent.js";
import { Position, Trade, PortfolioSummary } from "./portfolio.js";
import { DecisionLedgerRecord } from "./decision.js";
import { RiskEvent } from "./risk.js";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface GetMarketsResponse {
  markets: CandidateMarket[];
  total: number;
}

export interface GetAgentResponse {
  telemetry: AgentTelemetry;
}

export interface StartAgentRequest {
  environment?: "PAPER_TRADING" | "DEVNET" | "MAINNET";
  cycleIntervalSeconds?: number;
}

export interface PauseAgentRequest {
  reason?: string;
  panicLiquidate?: boolean;
}

export interface GetPositionsResponse {
  positions: Position[];
  totalOpenPositions: number;
}

export interface GetTradesResponse {
  trades: Trade[];
  totalTrades: number;
}

export interface GetPortfolioResponse {
  summary: PortfolioSummary;
}

export interface GetDecisionsResponse {
  decisions: DecisionLedgerRecord[];
  total: number;
}

export interface GetRiskEventsResponse {
  events: RiskEvent[];
  total: number;
}

export interface GetSystemHealthResponse {
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  version: string;
  uptimeSeconds: number;
  environment: string;
  solanaRpc: {
    status: "CONNECTED" | "ERROR";
    endpoint: string;
    latencyMs: number;
    currentSlot: number;
  };
  jupiterApi: {
    status: "CONNECTED" | "ERROR";
    latencyMs: number;
  };
  meteoraApi: {
    status: "CONNECTED" | "ERROR";
    latencyMs: number;
  };
  database: {
    status: "CONNECTED" | "ERROR";
  };
}
