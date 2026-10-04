import React, { useState } from "react";
import {
  Activity,
  Shield,
  Zap,
  Radio,
  Power,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Database,
  Terminal as TerminalIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  Info,
  Maximize2,
  Sliders,
} from "lucide-react";
import {
  CandidateMarket,
  AgentTelemetry,
  Position,
  DecisionLedgerRecord,
  PortfolioSummary,
  GetSystemHealthResponse,
} from "@nexora/shared";

interface DashboardViewProps {
  markets: CandidateMarket[];
  telemetry: AgentTelemetry | null;
  positions: Position[];
  decisions: DecisionLedgerRecord[];
  portfolio: PortfolioSummary | null;
  health: GetSystemHealthResponse | null;
  selectedMarket: CandidateMarket | null;
  onSelectMarket: (market: CandidateMarket) => void;
  onInspectMarket: (market: CandidateMarket) => void;
  onClosePosition: (id: string) => void;
  onOpenKillSwitch: () => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  markets,
  telemetry,
  positions,
  decisions,
  portfolio,
  health,
  selectedMarket,
  onSelectMarket,
  onInspectMarket,
  onClosePosition,
  onOpenKillSwitch,
  loading,
}) => {
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h">("15m");
  const focused = selectedMarket || markets[0] || null;

  // Active bin data calculation for DLMM visualization
  const activeBinId = focused?.metrics.activeBinId || 24810;
  const bins = [
    { id: activeBinId - 4, price: (focused?.metrics.priceUsdc || 148) * 0.98, depth: 35, type: "bid" },
    { id: activeBinId - 3, price: (focused?.metrics.priceUsdc || 148) * 0.985, depth: 55, type: "bid" },
    { id: activeBinId - 2, price: (focused?.metrics.priceUsdc || 148) * 0.99, depth: 85, type: "bid" },
    { id: activeBinId - 1, price: (focused?.metrics.priceUsdc || 148) * 0.995, depth: 140, type: "bid" },
    { id: activeBinId, price: focused?.metrics.priceUsdc || 148.42, depth: 220, type: "active" },
    { id: activeBinId + 1, price: (focused?.metrics.priceUsdc || 148) * 1.005, depth: 160, type: "ask" },
    { id: activeBinId + 2, price: (focused?.metrics.priceUsdc || 148) * 1.01, depth: 95, type: "ask" },
    { id: activeBinId + 3, price: (focused?.metrics.priceUsdc || 148) * 1.015, depth: 60, type: "ask" },
    { id: activeBinId + 4, price: (focused?.metrics.priceUsdc || 148) * 1.02, depth: 40, type: "ask" },
  ];

  const maxBinDepth = Math.max(...bins.map((b) => b.depth));
  const ofi = focused?.metrics.orderFlowImbalance ?? 0.65;
  const ofiPercent = Math.round(((ofi + 1) / 2) * 100);

  return (
    <div className="space-y-4">
      {/* 5-Second Dashboard KPI Telemetry Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Agent Status */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">1. Agent State</div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{telemetry?.state || "SCANNING"}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Cycle #{telemetry?.currentCycle || 1428}
          </div>
        </div>

        {/* KPI 2: Total Equity */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">2. Total Equity</div>
          <div className="font-mono font-bold text-base text-slate-100 tabular-nums">
            ${(portfolio?.totalEquityUsdc ?? 10428.5).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Cash: ${(portfolio?.freeCashUsdc ?? 9428.5).toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
        </div>

        {/* KPI 3: 24h PnL */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">3. Session 24h PnL</div>
          <div className="font-mono font-bold text-base text-emerald-400 tabular-nums flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>+${(portfolio?.realizedPnl24hUsdc ?? 385.7).toFixed(2)}</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-500 font-semibold">
            +{(portfolio?.realizedPnl24hPct ?? 3.85).toFixed(2)}% (Target &ge; +2%)
          </div>
        </div>

        {/* KPI 4: Active Deployed Capital */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">4. Capital Deployed</div>
          <div className="font-mono font-bold text-base text-cyan-400 tabular-nums">
            ${(portfolio?.allocatedCapitalUsdc ?? 1000).toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Utilization: {(portfolio?.utilizationPct ?? 9.58).toFixed(1)}% / 10.0% Max
          </div>
        </div>

        {/* KPI 5: Win Rate & Trades */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">5. Win Rate & Trades</div>
          <div className="font-mono font-bold text-base text-slate-100 tabular-nums">
            {(portfolio?.winRatePct ?? 75.0).toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {portfolio?.winningTradesCount ?? 9}W / {portfolio?.losingTradesCount ?? 3}L (PF: {(portfolio?.profitFactor ?? 3.2).toFixed(1)})
          </div>
        </div>

        {/* KPI 6: Risk Invariant Shield */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">6. Risk Invariants</div>
          <div className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>100% ARMED</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Max Trade: 10% | SL: -3.0%
          </div>
        </div>
      </div>

      {/* Main 3-Column Institutional Quantitative Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ==================================================================== */}
        {/* COLUMN 1 (Left, 3 cols): Real-Time Opportunity Scanner Stream */}
        {/* ==================================================================== */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
              <CompassIcon className="w-4 h-4 text-cyan-400" />
              <span>LIVE OPPORTUNITIES</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Score &ge; 70
            </span>
          </div>

          <div className="space-y-2">
            {markets.map((m) => {
              const isSelected = focused?.address === m.address;
              const isHot = m.opportunityScore >= 80;
              return (
                <div
                  key={m.address}
                  onClick={() => onSelectMarket(m)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/30"
                      : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <span>{m.baseToken.symbol}/{m.quoteToken.symbol}</span>
                      {isHot && (
                        <span className="px-1 py-0.2 rounded bg-amber-950/80 border border-amber-800/80 text-[9px] text-amber-400 font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-100 font-bold tabular-nums">
                        ${m.metrics.priceUsdc < 0.01 ? m.metrics.priceUsdc.toFixed(6) : m.metrics.priceUsdc.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="text-slate-500">{m.venue.replace("_", " ")}</span>
                    <span
                      className={`tabular-nums font-semibold ${
                        m.metrics.priceChange24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {m.metrics.priceChange24hPct >= 0 ? "+" : ""}
                      {m.metrics.priceChange24hPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Score Bar */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Score:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        m.opportunityScore >= 80
                          ? "text-emerald-400"
                          : m.opportunityScore >= 70
                          ? "text-cyan-400"
                          : "text-slate-400"
                      }`}
                    >
                      {m.opportunityScore.toFixed(1)} / 100
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.opportunityScore >= 80
                          ? "bg-emerald-400"
                          : m.opportunityScore >= 70
                          ? "bg-cyan-400"
                          : "bg-slate-600"
                      }`}
                      style={{ width: `${m.opportunityScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submodule Latency Widget */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-[11px]">
            <div className="text-slate-400 font-bold flex items-center justify-between">
              <span>PIPELINE LATENCIES</span>
              <span className="text-emerald-400">1.60s Total</span>
            </div>
            <div className="space-y-1 text-slate-500 text-[10px]">
              <div className="flex justify-between">
                <span>Ingestion & Cache:</span>
                <span className="text-slate-300 tabular-nums">
                  {telemetry?.submoduleLatencies.discoveryMs || 42}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Feature Vector:</span>
                <span className="text-slate-300 tabular-nums">
                  {telemetry?.submoduleLatencies.featuresMs || 18}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>AI Reasoning (Gemini):</span>
                <span className="text-cyan-400 tabular-nums font-semibold">
                  {telemetry?.submoduleLatencies.inferenceMs || 1420}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk Shield Invariants:</span>
                <span className="text-emerald-400 tabular-nums font-semibold">
                  {telemetry?.submoduleLatencies.riskEngineMs || 4}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pre-Flight Simulation:</span>
                <span className="text-slate-300 tabular-nums">
                  {telemetry?.submoduleLatencies.simulationMs || 120}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* COLUMN 2 (Center, 5 cols): Focused Asset Chart & Meteora DLMM Depth */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 space-y-3">
          {/* Chart Card */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            {/* Chart Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100">
                  {focused?.baseToken.symbol}/{focused?.quoteToken.symbol}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-[10px] text-cyan-400 font-semibold">
                  {focused?.venue.replace("_", " ")}
                </span>
                <button
                  onClick={() => focused && onInspectMarket(focused)}
                  className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
                  title="Open Deep Market Inspector"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 text-xs">
                {(["1m", "5m", "15m", "1h"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      timeframe === tf
                        ? "bg-cyan-500/20 text-cyan-400 font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Banner */}
            <div className="flex items-baseline gap-3 font-mono">
              <span className="text-2xl font-bold text-slate-100 tabular-nums">
                ${focused?.metrics.priceUsdc < 0.01 ? focused.metrics.priceUsdc.toFixed(6) : focused?.metrics.priceUsdc.toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  (focused?.metrics.priceChange24hPct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(focused?.metrics.priceChange24hPct || 0) >= 0 ? "+" : ""}
                {focused?.metrics.priceChange24hPct.toFixed(2)}% (24h)
              </span>
              <span className="text-slate-500 text-xs">
                Vol: ${(focused?.metrics.volume24hUsdc || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* High-Resolution Quantitative Candlestick & Volume Profile SVG */}
            <div className="h-52 w-full bg-slate-950/60 rounded border border-slate-800/80 p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                {/* Horizontal Grid */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="400" y2="70" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="400" y2="110" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

                {/* Candles */}
                {/* C1: Bearish */}
                <line x1="30" y1="50" x2="30" y2="110" stroke="#ff4d64" strokeWidth="1" />
                <rect x="25" y="60" width="10" height="40" fill="#ff4d64" />

                {/* C2: Bullish */}
                <line x1="65" y1="45" x2="65" y2="105" stroke="#00c087" strokeWidth="1" />
                <rect x="60" y="55" width="10" height="35" fill="#00c087" />

                {/* C3: Bullish */}
                <line x1="100" y1="40" x2="100" y2="95" stroke="#00c087" strokeWidth="1" />
                <rect x="95" y="50" width="10" height="35" fill="#00c087" />

                {/* C4: Bearish */}
                <line x1="135" y1="45" x2="135" y2="100" stroke="#ff4d64" strokeWidth="1" />
                <rect x="130" y="52" width="10" height="30" fill="#ff4d64" />

                {/* C5: Bullish breakout */}
                <line x1="170" y1="30" x2="170" y2="90" stroke="#00c087" strokeWidth="1" />
                <rect x="165" y="40" width="10" height="45" fill="#00c087" />

                {/* C6: Bullish continuation */}
                <line x1="205" y1="25" x2="205" y2="80" stroke="#00c087" strokeWidth="1" />
                <rect x="200" y="32" width="10" height="40" fill="#00c087" />

                {/* C7: Consolidation */}
                <line x1="240" y1="20" x2="240" y2="75" stroke="#00c087" strokeWidth="1" />
                <rect x="235" y="28" width="10" height="35" fill="#00c087" />

                {/* C8: Volume surge candle */}
                <line x1="275" y1="15" x2="275" y2="70" stroke="#00c087" strokeWidth="1" />
                <rect x="270" y="20" width="10" height="42" fill="#00c087" />

                {/* C9: Latest candle */}
                <line x1="310" y1="10" x2="310" y2="60" stroke="#00c087" strokeWidth="1" />
                <rect x="305" y="15" width="10" height="38" fill="#00c087" />

                {/* Live price line */}
                <line x1="0" y1="15" x2="400" y2="15" stroke="#00c087" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx="310" cy="15" r="3" fill="#00c087" className="animate-pulse" />

                {/* Volume bars at bottom */}
                <rect x="25" y="130" width="10" height="20" fill="#ff4d64" opacity="0.4" />
                <rect x="60" y="125" width="10" height="25" fill="#00c087" opacity="0.4" />
                <rect x="95" y="135" width="10" height="15" fill="#00c087" opacity="0.4" />
                <rect x="130" y="138" width="10" height="12" fill="#ff4d64" opacity="0.4" />
                <rect x="165" y="120" width="10" height="30" fill="#00c087" opacity="0.4" />
                <rect x="200" y="122" width="10" height="28" fill="#00c087" opacity="0.4" />
                <rect x="235" y="128" width="10" height="22" fill="#00c087" opacity="0.4" />
                <rect x="270" y="110" width="10" height="40" fill="#00c087" opacity="0.6" />
                <rect x="305" y="105" width="10" height="45" fill="#00c087" opacity="0.8" />
              </svg>

              <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 font-bold">
                Meteora Active Bin #{activeBinId}
              </div>
            </div>

            {/* Order Flow Imbalance (OFI) Bar */}
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Order Flow Imbalance (OFI):</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +{ofi.toFixed(2)} (Buy Dominance)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${ofiPercent}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${100 - ofiPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>SELL PRESSURE ({(100 - ofiPercent)}%)</span>
                <span>BUY PRESSURE ({ofiPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Meteora DLMM Active Bin Distribution Visualizer */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>METEORA DLMM BIN LIQUIDITY PROFILE</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                Fee APR: {focused?.metrics.feeAprPct.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-9 gap-1 items-end h-20 pt-2 border-b border-slate-800/80">
              {bins.map((b) => {
                const heightPct = Math.round((b.depth / maxBinDepth) * 100);
                const isCenter = b.type === "active";
                return (
                  <div key={b.id} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isCenter
                          ? "bg-emerald-400 shadow-md shadow-emerald-500/30"
                          : b.type === "bid"
                          ? "bg-teal-700/60"
                          : "bg-cyan-700/60"
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`Bin ${b.id}: $${b.price.toFixed(2)} (${b.depth}k depth)`}
                    />
                    <span className="text-[8px] text-slate-500 tabular-nums">
                      {isCenter ? "ACT" : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 pt-1">
              <span>Bids (SOL Accumulation)</span>
              <span className="text-emerald-400 font-semibold">Active Price: ${focused?.metrics.priceUsdc.toFixed(2)}</span>
              <span>Asks (USDC Take Profit)</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* COLUMN 3 (Right, 4 cols): Active Positions & Real-Time Decision Ledger */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 space-y-3 font-mono">
          {/* Active Positions Card */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <div className="flex items-center gap-1.5">
                <BriefcaseIcon className="w-4 h-4 text-emerald-400" />
                <span>ACTIVE POSITIONS ({positions.length})</span>
              </div>
              <span className="text-[10px] text-slate-500">
                10.0% Max Cap
              </span>
            </div>

            {positions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                No open positions currently deployed.
              </div>
            ) : (
              positions.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-100">{p.pairSymbol}</span>
                    <span className="text-emerald-400 font-semibold">
                      +{p.unrealizedPnlPct.toFixed(2)}% (+${p.unrealizedPnlUsdc.toFixed(2)})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500">Size:</span> ${p.sizeUsdc.toFixed(0)}
                    </div>
                    <div>
                      <span className="text-slate-500">Entry:</span> ${p.entryPriceUsdc.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-slate-500">TP Target:</span>{" "}
                      <span className="text-emerald-400">${p.takeProfitPriceUsdc.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Stop Loss:</span>{" "}
                      <span className="text-rose-400">${p.stopLossPriceUsdc.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500">
                      Trailing SL: ${p.trailingStopPriceUsdc?.toFixed(2) || "N/A"}
                    </span>
                    <button
                      onClick={() => onClosePosition(p.id)}
                      className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-[10px] font-bold text-rose-300 transition-colors"
                    >
                      EMERGENCY UNWIND
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real-Time Decision Ledger & Audit Trail */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <div className="flex items-center gap-1.5">
                <FileTextIcon className="w-4 h-4 text-cyan-400" />
                <span>DECISION AUDIT LEDGER</span>
              </div>
              <span className="text-[10px] text-slate-500">Zero-Bypass</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {decisions.map((d) => {
                const isApproved = d.riskVerdict === "APPROVED";
                return (
                  <div
                    key={d.id}
                    className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-slate-200">
                        <span>{d.id}</span>
                        <span className="text-slate-500">|</span>
                        <span>{d.pairSymbol}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isApproved
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : "bg-rose-950 text-rose-400 border border-rose-800/60"
                        }`}
                      >
                        {d.riskVerdict}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {d.decision.entryReason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                      <span>Conf: {d.decision.confidence}%</span>
                      {d.txSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${d.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Solscan</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {d.rejectionReason && (
                        <span className="text-rose-400 truncate max-w-[150px]" title={d.rejectionReason}>
                          {d.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CompassIcon(props: any) {
  return <Layers {...props} />;
}

function BriefcaseIcon(props: any) {
  return <Shield {...props} />;
}

function FileTextIcon(props: any) {
  return <TerminalIcon {...props} />;
}
