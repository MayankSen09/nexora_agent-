export type PositionStatus = "OPEN" | "CLOSED" | "LIQUIDATING" | "STOPPED_OUT";

export interface Position {
  id: string;
  pairAddress: string;
  pairSymbol: string;
  baseMint: string;
  quoteMint: string;
  direction: "LONG";
  entryPriceUsdc: number;
  currentPriceUsdc: number;
  sizeUnits: number;
  sizeUsdc: number;
  unrealizedPnlUsdc: number;
  unrealizedPnlPct: number;
  takeProfitPriceUsdc: number;
  stopLossPriceUsdc: number;
  trailingStopPriceUsdc?: number;
  peakPriceUsdc: number;
  openedAt: string;
  updatedAt: string;
  status: PositionStatus;
}

export interface Trade {
  id: string;
  positionId?: string;
  pairAddress: string;
  pairSymbol: string;
  side: "BUY" | "SELL";
  priceUsdc: number;
  sizeUnits: number;
  sizeUsdc: number;
  realizedPnlUsdc?: number;
  realizedPnlPct?: number;
  feeUsdc: number;
  txSignature: string;
  executedAt: string;
  exitReason?: "TAKE_PROFIT_1" | "TAKE_PROFIT_2" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXPIRED" | "MANUAL_PANIC";
}

export interface PortfolioSummary {
  totalEquityUsdc: number;
  freeCashUsdc: number;
  allocatedCapitalUsdc: number;
  utilizationPct: number;
  unrealizedPnlUsdc: number;
  unrealizedPnlPct: number;
  realizedPnl24hUsdc: number;
  realizedPnl24hPct: number;
  winRatePct: number;
  profitFactor: number;
  totalTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  maxDrawdown24hPct: number;
  updatedAt: string;
}
