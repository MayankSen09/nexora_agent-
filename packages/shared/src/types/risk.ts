import { RejectionReasonCode } from "../constants/index.js";
import { ExecutionEnvironment } from "./agent.js";

export interface RiskPolicyConfig {
  maxPositionPercent: number;
  maxDailyLossPercent: number;
  maxTokenExposurePercent: number;
  maxSlippagePercent: number;
  maxOpenPositions: number;
  minLiquidityUsd: number;
  emergencyStop: boolean;
  whitelistedQuoteMints: string[];
  executionMode: ExecutionEnvironment;
}

export interface RiskEvent {
  id: string;
  timestamp: string;
  eventType: "INVARIANT_BREACH" | "CIRCUIT_BREAKER_TRIP" | "KILL_SWITCH_ENGAGED" | "SLIPPAGE_VIOLATION" | "COOLDOWN_TRIGGER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasonCode: RejectionReasonCode;
  pairAddress?: string;
  pairSymbol?: string;
  details: string;
  actionTaken: "REJECTED_TRADE" | "PAUSED_AGENT" | "LIQUIDATED_POSITIONS" | "ALERTED_ONLY";
}
