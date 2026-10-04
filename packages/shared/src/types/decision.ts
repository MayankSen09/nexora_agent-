export type TradeAction = "BUY" | "SELL" | "HOLD" | "AVOID";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type TimeHorizon = "SCALP_5M" | "SHORT_15M" | "SWING_1H" | "POSITION_4H";

export interface DecisionSignal {
  name: string;
  value: number;
  weight: number;
}

export interface NexoraTradeDecision {
  action: TradeAction;
  confidence: number; // 0 to 100
  positionSizePercent: number; // 0.0 to 10.0
  entryReason: string;
  riskLevel: RiskLevel;
  invalidationReason: string;
  timeHorizon: TimeHorizon;
  signals: DecisionSignal[];
}

export interface DecisionLedgerRecord {
  id: string;
  timestamp: string;
  pairAddress: string;
  pairSymbol: string;
  score: number;
  decision: NexoraTradeDecision;
  riskVerdict: "APPROVED" | "REJECTED";
  rejectionReason?: string;
  clampedPositionSizeUsdc?: number;
  txSignature?: string;
}
