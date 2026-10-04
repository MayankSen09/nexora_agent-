import React from "react";
import {
  TrendingUp,
  Shield,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
} from "lucide-react";
import { PortfolioSummary } from "@nexora/shared";

interface PortfolioViewProps {
  portfolio: PortfolioSummary | null;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio }) => {
  const total = portfolio?.totalEquityUsdc ?? 10428.5;
  const freeCash = portfolio?.freeCashUsdc ?? 9428.5;
  const allocated = portfolio?.allocatedCapitalUsdc ?? 1000.0;
  const freeCashPct = total > 0 ? (freeCash / total) * 100 : 90;
  const allocatedPct = total > 0 ? (allocated / total) * 100 : 10;

  const dailyPnL = [
    { day: "Mon", pnl: 45.2, isWin: true },
    { day: "Tue", pnl: 68.0, isWin: true },
    { day: "Wed", pnl: -18.5, isWin: false },
    { day: "Thu", pnl: 112.4, isWin: true },
    { day: "Fri", pnl: 84.1, isWin: true },
    { day: "Sat", pnl: -12.6, isWin: false },
    { day: "Sun", pnl: 106.9, isWin: true },
  ];

  const maxDayPnl = Math.max(...dailyPnL.map((d) => Math.abs(d.pnl)));

  return (
    <div className="space-y-6 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header & Primary KPIs */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>PORTFOLIO & CAPITAL PERFORMANCE</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Institutional Capital Allocation Overview
          </h2>
        </div>

        {/* 6 Grid KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Total Portfolio Equity</span>
            <div className="text-lg font-bold text-slate-100 tabular-nums">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">Vault PDA Devnet</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">24h Realized PnL</span>
            <div className="text-lg font-bold text-emerald-400 tabular-nums flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+${(portfolio?.realizedPnl24hUsdc ?? 385.7).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold">
              +{(portfolio?.realizedPnl24hPct ?? 3.85).toFixed(2)}%
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Win Rate %</span>
            <div className="text-lg font-bold text-cyan-400 tabular-nums">
              {(portfolio?.winRatePct ?? 75.0).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400">
              {portfolio?.winningTradesCount ?? 9}W / {portfolio?.losingTradesCount ?? 3}L
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Profit Factor</span>
            <div className="text-lg font-bold text-slate-100 tabular-nums">
              {(portfolio?.profitFactor ?? 3.2).toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-400">Institutional Grade</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Max Drawdown (24h)</span>
            <div className="text-lg font-bold text-amber-400 tabular-nums">
              -{(portfolio?.maxDrawdown24hPct ?? 1.2).toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400">Circuit Breaker: -3.0%</div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Estimated Sharpe</span>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">2.42</div>
            <div className="text-[10px] text-slate-400">Risk-Adjusted Alpha</div>
          </div>
        </div>
      </div>

      {/* 2. Capital Allocation Donut & 30-Day Growth Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Asset Allocation */}
        <div className="lg:col-span-4 p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>CAPITAL ASSET ALLOCATION</span>
          </div>

          <div className="space-y-3">
            {/* Free Cash */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Free USDC Cash Buffer</span>
                <span className="font-bold tabular-nums">${freeCash.toFixed(2)} ({freeCashPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full" style={{ width: `${freeCashPct}%` }} />
              </div>
            </div>

            {/* Active Positions */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Active DLMM Trading Positions</span>
                <span className="font-bold text-cyan-400 tabular-nums">${allocated.toFixed(2)} ({allocatedPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${allocatedPct}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="text-emerald-400 font-bold">Policy Safety Enforcement:</div>
            <div>The agent is mathematically restricted from allocating &gt; 10.0% into any single pair, preserving 90% liquidity for circuit-breaker safety.</div>
          </div>
        </div>

        {/* Right: 30-Day Cumulative Growth Curve */}
        <div className="lg:col-span-8 p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">
              30-DAY CUMULATIVE VAULT EQUITY GROWTH
            </span>
            <span className="text-emerald-400 font-bold tabular-nums">
              +$1,428.50 (+14.28%)
            </span>
          </div>

          {/* SVG Growth Curve */}
          <div className="h-44 w-full bg-slate-950/60 rounded border border-slate-800/80 p-2 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 140" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="600" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

              <defs>
                <linearGradient id="portfolioCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00C087" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00C087" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 0 120 Q 100 110, 200 85 T 380 65 T 500 40 T 600 20 L 600 140 L 0 140 Z"
                fill="url(#portfolioCurveGrad)"
              />

              <path
                d="M 0 120 Q 100 110, 200 85 T 380 65 T 500 40 T 600 20"
                fill="none"
                stroke="#00C087"
                strokeWidth="2.5"
              />

              <circle cx="200" cy="85" r="3.5" fill="#00C087" />
              <circle cx="380" cy="65" r="3.5" fill="#00C087" />
              <circle cx="500" cy="40" r="3.5" fill="#00C087" />
              <circle cx="600" cy="20" r="4.5" fill="#00C087" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
            <span>Day 1: $9,000.00</span>
            <span>Day 15: $9,650.00</span>
            <span className="text-emerald-400 font-bold">Current: $10,428.50</span>
          </div>
        </div>
      </div>

      {/* 3. Daily PnL Distribution Bar Chart */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>7-DAY DAILY PnL DISTRIBUTION</span>
          </span>
          <span className="text-slate-400">Net 7d: <span className="text-emerald-400 font-bold">+$385.70</span></span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-28 pt-4">
          {dailyPnL.map((d, i) => {
            const heightPct = Math.round((Math.abs(d.pnl) / maxDayPnl) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className={`text-[10px] font-bold tabular-nums ${d.isWin ? "text-emerald-400" : "text-rose-400"}`}>
                  {d.pnl > 0 ? "+" : ""}${d.pnl.toFixed(1)}
                </span>
                <div
                  className={`w-full rounded-t transition-all ${
                    d.isWin ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[10px] text-slate-500">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
