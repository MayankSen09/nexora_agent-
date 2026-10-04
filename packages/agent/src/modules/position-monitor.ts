import { Position } from "@nexora/shared";
import { db } from "@nexora/database";

export class PositionMonitor {
  /**
   * Updates an open position with the latest market price,
   * calculates unrealized PnL, updates peak price, and raises trailing stop floor.
   */
  public updatePositionPrice(
    positionId: string,
    currentPriceUsdc: number,
    trailingStopDistancePct = 2.0
  ): Position | undefined {
    const pos = db.positions.get(positionId);
    if (!pos || pos.status !== "OPEN") return undefined;

    pos.currentPriceUsdc = currentPriceUsdc;
    pos.updatedAt = new Date().toISOString();

    // Mark-to-market PnL calculation
    const priceDelta = pos.currentPriceUsdc - pos.entryPriceUsdc;
    pos.unrealizedPnlPct = Math.round((priceDelta / pos.entryPriceUsdc) * 10000) / 100;
    pos.unrealizedPnlUsdc = Math.round(((pos.sizeUsdc * pos.unrealizedPnlPct) / 100) * 100) / 100;

    // Peak Price and Trailing Stop adjustment
    if (pos.currentPriceUsdc > pos.peakPriceUsdc) {
      pos.peakPriceUsdc = pos.currentPriceUsdc;
      
      // Update trailing stop only if peak price is in profit
      const trailingFloor = pos.peakPriceUsdc * (1 - trailingStopDistancePct / 100);
      if (pos.trailingStopPriceUsdc === undefined || trailingFloor > pos.trailingStopPriceUsdc) {
        pos.trailingStopPriceUsdc = Math.round(trailingFloor * 100) / 100;
      }
    }

    db.positions.set(pos.id, pos);
    return pos;
  }

  /**
   * Returns all active open positions.
   */
  public getOpenPositions(): Position[] {
    return Array.from(db.positions.values()).filter((p) => p.status === "OPEN");
  }
}
