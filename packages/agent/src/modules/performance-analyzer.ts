import { Trade } from "@nexora/shared";
import { db } from "@nexora/database";

export interface AggregatePerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  totalRealizedPnlUsdc: number;
  averageTradePnlPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatioEstimate: number;
}

export class PerformanceAnalyzer {
  public computeMetrics(trades: Trade[] = db.trades): AggregatePerformanceMetrics {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRatePct: 0,
        totalRealizedPnlUsdc: 0,
        averageTradePnlPct: 0,
        profitFactor: 0,
        maxDrawdownPct: 0,
        sharpeRatioEstimate: 0,
      };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalPnlUsdc = 0;
    let totalPnlPct = 0;
    const pnlPcts: number[] = [];

    for (const trade of trades) {
      const pnlUsdc = trade.realizedPnlUsdc ?? 0;
      const pnlPct = trade.realizedPnlPct ?? 0;

      totalPnlUsdc += pnlUsdc;
      totalPnlPct += pnlPct;
      pnlPcts.push(pnlPct);

      if (pnlUsdc > 0) {
        winningTrades++;
        grossProfit += pnlUsdc;
      } else {
        losingTrades++;
        grossLoss += Math.abs(pnlUsdc);
      }
    }

    const totalTrades = trades.length;
    const winRatePct = Math.round((winningTrades / totalTrades) * 1000) / 10;
    const averageTradePnlPct = Math.round((totalPnlPct / totalTrades) * 100) / 100;
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 10.0 : 0) : Math.round((grossProfit / grossLoss) * 100) / 100;

    // Approximate Sharpe Ratio (Mean / Standard Deviation)
    const meanPnl = totalPnlPct / totalTrades;
    const variance =
      pnlPcts.reduce((sum, p) => sum + Math.pow(p - meanPnl, 2), 0) / Math.max(1, totalTrades - 1);
    const stdDev = Math.sqrt(variance);
    const sharpeRatioEstimate = stdDev === 0 ? 0 : Math.round((meanPnl / stdDev) * Math.sqrt(252) * 10) / 10;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRatePct,
      totalRealizedPnlUsdc: Math.round(totalPnlUsdc * 100) / 100,
      averageTradePnlPct,
      profitFactor,
      maxDrawdownPct: db.portfolio.maxDrawdown24hPct,
      sharpeRatioEstimate: Math.max(0, sharpeRatioEstimate),
    };
  }
}
