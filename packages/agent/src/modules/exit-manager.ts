import { Position, Trade } from "@nexora/shared";
import { db } from "@nexora/database";

export type ExitReasonType =
  | "TAKE_PROFIT_1"
  | "TAKE_PROFIT_2"
  | "STOP_LOSS"
  | "TRAILING_STOP"
  | "TIME_EXPIRED"
  | "MANUAL_PANIC";

export interface ExitTriggerResult {
  shouldExit: boolean;
  reason?: ExitReasonType;
  details?: string;
}

export class ExitManager {
  /**
   * Checks deterministic exit conditions for a given open position.
   */
  public evaluateExit(position: Position, maxHoldTimeMinutes = 45): ExitTriggerResult {
    if (position.status !== "OPEN") {
      return { shouldExit: false };
    }

    // 1. Hard Stop Loss Condition
    if (position.currentPriceUsdc <= position.stopLossPriceUsdc) {
      return {
        shouldExit: true,
        reason: "STOP_LOSS",
        details: `Price ($${position.currentPriceUsdc}) breached Stop Loss ($${position.stopLossPriceUsdc}).`,
      };
    }

    // 2. Take Profit Condition
    if (position.currentPriceUsdc >= position.takeProfitPriceUsdc) {
      return {
        shouldExit: true,
        reason: "TAKE_PROFIT_1",
        details: `Price ($${position.currentPriceUsdc}) reached Take Profit target ($${position.takeProfitPriceUsdc}).`,
      };
    }

    // 3. Trailing Stop Condition
    if (
      position.trailingStopPriceUsdc !== undefined &&
      position.trailingStopPriceUsdc > position.stopLossPriceUsdc &&
      position.currentPriceUsdc <= position.trailingStopPriceUsdc
    ) {
      return {
        shouldExit: true,
        reason: "TRAILING_STOP",
        details: `Price ($${position.currentPriceUsdc}) retraced below dynamic Trailing Stop ($${position.trailingStopPriceUsdc}).`,
      };
    }

    // 4. Maximum Hold Time Condition
    const openedTimeMs = new Date(position.openedAt).getTime();
    const elapsedMinutes = (Date.now() - openedTimeMs) / (1000 * 60);
    if (elapsedMinutes >= maxHoldTimeMinutes) {
      return {
        shouldExit: true,
        reason: "TIME_EXPIRED",
        details: `Position held for ${Math.round(elapsedMinutes)} minutes (Max limit: ${maxHoldTimeMinutes}m).`,
      };
    }

    return { shouldExit: false };
  }

  /**
   * Executes position closing, records trade receipt, and updates portfolio.
   */
  public closePosition(
    positionId: string,
    reason: ExitReasonType,
    exitPriceUsdc?: number,
    txSignature = "tx_mock_exit_signature"
  ): Trade | undefined {
    const pos = db.positions.get(positionId);
    if (!pos || pos.status !== "OPEN") return undefined;

    const exitPrice = exitPriceUsdc ?? pos.currentPriceUsdc;
    const priceDelta = exitPrice - pos.entryPriceUsdc;
    const pnlPct = Math.round((priceDelta / pos.entryPriceUsdc) * 10000) / 100;
    const pnlUsdc = Math.round(((pos.sizeUsdc * pnlPct) / 100) * 100) / 100;
    const now = new Date().toISOString();

    pos.status = "CLOSED";
    pos.currentPriceUsdc = exitPrice;
    pos.unrealizedPnlPct = 0;
    pos.unrealizedPnlUsdc = 0;
    pos.updatedAt = now;

    db.positions.set(pos.id, pos);

    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      positionId: pos.id,
      pairAddress: pos.pairAddress,
      pairSymbol: pos.pairSymbol,
      side: "SELL",
      priceUsdc: exitPrice,
      sizeUnits: pos.sizeUnits,
      sizeUsdc: pos.sizeUsdc,
      realizedPnlUsdc: pnlUsdc,
      realizedPnlPct: pnlPct,
      feeUsdc: 0.50,
      exitReason: reason,
      txSignature,
      executedAt: now,
    };

    db.trades.unshift(trade);

    // Update portfolio balances
    db.portfolio.freeCashUsdc += pos.sizeUsdc + pnlUsdc;
    db.portfolio.allocatedCapitalUsdc = Math.max(0, db.portfolio.allocatedCapitalUsdc - pos.sizeUsdc);
    db.portfolio.totalEquityUsdc = db.portfolio.freeCashUsdc + db.portfolio.allocatedCapitalUsdc;
    db.portfolio.realizedPnl24hUsdc += pnlUsdc;
    db.portfolio.totalTradesCount += 1;
    if (pnlUsdc > 0) {
      db.portfolio.winningTradesCount += 1;
    } else {
      db.portfolio.losingTradesCount += 1;
    }
    db.portfolio.winRatePct =
      Math.round((db.portfolio.winningTradesCount / db.portfolio.totalTradesCount) * 1000) / 10;
    db.portfolio.updatedAt = now;

    return trade;
  }
}
