import React from "react";
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Clock,
  Layers,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { Position, PortfolioSummary } from "@nexora/shared";
import { formatCurrency, formatPrice, formatPercent } from "@nexora/ui";

interface PositionsViewProps {
  positions: Position[];
  portfolio: PortfolioSummary | null;
  onClosePosition: (id: string) => void;
  onOpenKillSwitch: () => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions,
  portfolio,
  onClosePosition,
  onOpenKillSwitch,
}) => {
  const totalAllocated = portfolio?.allocatedCapitalUsdc ?? 1000;
  const totalEquity = portfolio?.totalEquityUsdc ?? 10428.5;
  const utilizationPct = portfolio?.utilizationPct ?? 9.58;

  return (
    <div className="space-y-4 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header & Risk Gauges */}
      <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>ACTIVE POSITION LEDGER</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Live Managed Open Positions
            </h2>
          </div>

          <button
            onClick={onOpenKillSwitch}
            className="px-3 py-1.5 rounded-sm bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>LIQUIDATE ALL POSITIONS</span>
          </button>
        </div>

        {/* Portfolio Margin Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-sm bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Capital Utilization</span>
            <div className="text-base font-bold text-cyan-400 font-mono tabular-nums">
              {formatCurrency(totalAllocated)} / {formatCurrency(totalEquity)}
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-sm overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${Math.min(100, utilizationPct * 10)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              {formatPercent(utilizationPct)} Deployed (Max 10.0% Single Asset)
            </div>
          </div>

          <div className="p-3 rounded-sm bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Unrealized Session PnL</span>
            <div className="text-base font-bold text-emerald-400 font-mono tabular-nums flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{formatCurrency(portfolio?.unrealizedPnlUsdc ?? 42.8)}</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold">
              +{formatPercent(portfolio?.unrealizedPnlPct ?? 4.28)} on active capital
            </div>
          </div>

          <div className="p-3 rounded-sm bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Automated Exit Protection</span>
            <div className="text-base font-bold text-slate-100">Trailing Stop Armed</div>
            <div className="text-[10px] text-slate-400 font-mono">
              TP1: +6.0% | TP2: +12.0% | SL: -3.0%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Open Positions Table */}
      <div className="rounded-sm bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">Position ID</th>
              <th className="p-3">Asset Pair</th>
              <th className="p-3">Direction</th>
              <th className="p-3">Entry Price</th>
              <th className="p-3">Current Price</th>
              <th className="p-3">Size (USDC)</th>
              <th className="p-3">Unrealized PnL</th>
              <th className="p-3">TP Target</th>
              <th className="p-3">Stop Loss</th>
              <th className="p-3">Trailing Stop</th>
              <th className="p-3 text-right">Emergency Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-sm bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-slate-200 font-semibold text-sm">No Active Positions</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      The autonomous agent is monitoring Solana DLMM and Jupiter liquidity pools. Trades will populate here once opportunity score &ge; 70.0 and invariants pass.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              positions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-400">{p.id}</td>
                  <td className="p-3 font-bold text-slate-100">{p.pairSymbol}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400 font-bold">
                      {p.direction}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums font-semibold">{formatPrice(p.entryPriceUsdc)}</td>
                  <td className="p-3 tabular-nums font-semibold text-slate-100">
                    {formatPrice(p.currentPriceUsdc)}
                  </td>
                  <td className="p-3 tabular-nums text-cyan-400 font-semibold">
                    {formatCurrency(p.sizeUsdc)}
                  </td>
                  <td className="p-3 tabular-nums font-bold text-emerald-400">
                    +{formatPercent(p.unrealizedPnlPct)} (+{formatCurrency(p.unrealizedPnlUsdc)})
                  </td>
                  <td className="p-3 tabular-nums text-emerald-400">
                    {formatPrice(p.takeProfitPriceUsdc)}
                  </td>
                  <td className="p-3 tabular-nums text-rose-400">
                    {formatPrice(p.stopLossPriceUsdc)}
                  </td>
                  <td className="p-3 tabular-nums text-amber-400 font-semibold">
                    {p.trailingStopPriceUsdc ? formatPrice(p.trailingStopPriceUsdc) : "N/A"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onClosePosition(p.id)}
                      className="px-2.5 py-1 rounded-sm bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-bold transition-colors"
                    >
                      UNWIND
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
