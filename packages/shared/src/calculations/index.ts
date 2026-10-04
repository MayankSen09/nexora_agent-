/**
 * Quantitative finance calculation utilities for Nexora.
 */

export interface PnlCalculationResult {
  realizedPnlUsdc: number;
  realizedPnlPct: number;
  netPnlUsdc: number;
  feeUsdc: number;
}

/**
 * Calculates realized PnL and percentage for a closed position.
 */
export function calculateRealizedPnl(
  entryPriceUsdc: number,
  exitPriceUsdc: number,
  sizeUnits: number,
  feeUsdc = 0
): PnlCalculationResult {
  if (entryPriceUsdc <= 0 || sizeUnits <= 0) {
    return { realizedPnlUsdc: 0, realizedPnlPct: 0, netPnlUsdc: 0, feeUsdc: 0 };
  }

  const grossPnl = (exitPriceUsdc - entryPriceUsdc) * sizeUnits;
  const netPnl = grossPnl - feeUsdc;
  const costBasis = entryPriceUsdc * sizeUnits;
  const pnlPct = costBasis > 0 ? (netPnl / costBasis) * 100.0 : 0.0;

  return {
    realizedPnlUsdc: Math.round(grossPnl * 100) / 100,
    realizedPnlPct: Math.round(pnlPct * 100) / 100,
    netPnlUsdc: Math.round(netPnl * 100) / 100,
    feeUsdc: Math.round(feeUsdc * 100) / 100,
  };
}

/**
 * Calculates unrealized PnL for an active position.
 */
export function calculateUnrealizedPnl(
  entryPriceUsdc: number,
  currentPriceUsdc: number,
  sizeUnits: number
): { unrealizedPnlUsdc: number; unrealizedPnlPct: number } {
  if (entryPriceUsdc <= 0 || sizeUnits <= 0) {
    return { unrealizedPnlUsdc: 0, unrealizedPnlPct: 0 };
  }

  const grossPnl = (currentPriceUsdc - entryPriceUsdc) * sizeUnits;
  const costBasis = entryPriceUsdc * sizeUnits;
  const pnlPct = costBasis > 0 ? (grossPnl / costBasis) * 100.0 : 0.0;

  return {
    unrealizedPnlUsdc: Math.round(grossPnl * 100) / 100,
    unrealizedPnlPct: Math.round(pnlPct * 100) / 100,
  };
}

/**
 * Calculates the maximum drawdown percentage from an equity curve array.
 */
export function calculateMaxDrawdown(equitySeries: number[]): number {
  if (!equitySeries || equitySeries.length < 2) return 0;

  let peak = equitySeries[0];
  let maxDrawdownPct = 0;

  for (const equity of equitySeries) {
    if (equity > peak) {
      peak = equity;
    }
    const ddPct = peak > 0 ? ((peak - equity) / peak) * 100.0 : 0;
    if (ddPct > maxDrawdownPct) {
      maxDrawdownPct = ddPct;
    }
  }

  return Math.round(maxDrawdownPct * 100) / 100;
}

/**
 * Calculates the annualized Sharpe Ratio from an array of periodic returns.
 */
export function calculateSharpeRatio(
  returns: number[],
  annualRiskFreeRate = 0.02,
  periodsPerYear = 365
): number {
  if (!returns || returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const periodicRiskFree = annualRiskFreeRate / periodsPerYear;
  const sharpe = ((mean - periodicRiskFree) / stdDev) * Math.sqrt(periodsPerYear);

  return Math.round(sharpe * 100) / 100;
}

/**
 * Calculates win rate percentage and profit factor from trade history.
 */
export function calculatePerformanceMetrics(trades: { realizedPnlUsdc?: number }[]): {
  winRatePct: number;
  profitFactor: number;
  totalWins: number;
  totalLosses: number;
} {
  if (!trades || trades.length === 0) {
    return { winRatePct: 0, profitFactor: 0, totalWins: 0, totalLosses: 0 };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let totalWins = 0;
  let totalLosses = 0;

  for (const t of trades) {
    const pnl = t.realizedPnlUsdc ?? 0;
    if (pnl > 0) {
      grossProfit += pnl;
      totalWins++;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      totalLosses++;
    }
  }

  const completedTrades = totalWins + totalLosses;
  const winRate = completedTrades > 0 ? (totalWins / completedTrades) * 100.0 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999.0 : 0;

  return {
    winRatePct: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalWins,
    totalLosses,
  };
}

/**
 * Calculates clamped position size adhering to maximum risk caps.
 */
export function calculatePositionSize(
  totalEquityUsdc: number,
  requestedPercent: number,
  maxAllowedPercent = 10.0,
  hardCapUsdc = 1000.0,
  minSizeUsdc = 25.0
): { sizeUsdc: number; isClamped: boolean; isValid: boolean } {
  if (totalEquityUsdc <= 0 || requestedPercent <= 0) {
    return { sizeUsdc: 0, isClamped: false, isValid: false };
  }

  const uncappedSize = (totalEquityUsdc * requestedPercent) / 100.0;
  const maxPercentSize = (totalEquityUsdc * maxAllowedPercent) / 100.0;
  const boundedSize = Math.min(uncappedSize, maxPercentSize, hardCapUsdc);
  const isClamped = boundedSize < uncappedSize;
  const isValid = boundedSize >= minSizeUsdc;

  return {
    sizeUsdc: Math.round(boundedSize * 100) / 100,
    isClamped,
    isValid,
  };
}
