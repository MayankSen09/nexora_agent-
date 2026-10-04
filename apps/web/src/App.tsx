import React, { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  Zap,
  Radio,
  Power,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Database,
  Terminal as TerminalIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  CandidateMarket,
  AgentTelemetry,
  Position,
  DecisionLedgerRecord,
  PortfolioSummary,
  GetSystemHealthResponse,
} from "@nexora/shared";

export default function App() {
  const [activeTab, setActiveTab] = useState<"terminal" | "scanner" | "reasoning" | "risk">("terminal");
  const [markets, setMarkets] = useState<CandidateMarket[]>([]);
  const [telemetry, setTelemetry] = useState<AgentTelemetry | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [decisions, setDecisions] = useState<DecisionLedgerRecord[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [health, setHealth] = useState<GetSystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);

  // Fetch initial telemetry and operational data
  const fetchData = async () => {
    try {
      const [mktRes, agentRes, posRes, decRes, portRes, healthRes] = await Promise.all([
        fetch("/api/markets").then((r) => r.json()),
        fetch("/api/agent").then((r) => r.json()),
        fetch("/api/positions").then((r) => r.json()),
        fetch("/api/decisions").then((r) => r.json()),
        fetch("/api/portfolio").then((r) => r.json()),
        fetch("/api/system/health").then((r) => r.json()),
      ]);

      if (mktRes.success) setMarkets(mktRes.data.markets);
      if (agentRes.success) setTelemetry(agentRes.data.telemetry);
      if (posRes.success) setPositions(posRes.data.positions);
      if (decRes.success) setDecisions(decRes.data.decisions);
      if (portRes.success) setPortfolio(portRes.data.summary);
      if (healthRes.success) setHealth(healthRes.data);
    } catch (err) {
      console.error("API Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAgent = async () => {
    if (!telemetry) return;
    try {
      if (telemetry.state === "PAUSED") {
        await fetch("/api/agent/start", { method: "POST" });
      } else {
        await fetch("/api/agent/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "OPERATOR_PAUSE" }),
        });
      }
      fetchData();
    } catch (err) {
      console.error("Failed to toggle agent:", err);
    }
  };

  const handlePanicKill = async (liquidate: boolean) => {
    try {
      await fetch("/api/agent/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "EMERGENCY_KILL_SWITCH", panicLiquidate: liquidate }),
      });
      setKillSwitchModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Kill switch error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-[#DCDEE5] flex flex-col font-sans selection:bg-[#00B4D8]/20">
      {/* 1. Global Terminal Navigation Header */}
      <header className="h-12 border-b border-[#2A3448]/60 bg-[#0B0E14] px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-[#00B4D8] rounded-xs flex items-center justify-center font-bold text-black text-xs font-mono">
              N
            </div>
            <span className="font-bold text-sm tracking-wider text-white">NEXORA</span>
            <span className="text-2xs bg-[#171E2C] text-[#96A2B8] px-1.5 py-0.5 rounded-xs border border-[#2A3448]">
              v1.0-DEVNET
            </span>
          </div>

          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                activeTab === "terminal" ? "bg-[#171E2C] text-white text-semibold" : "text-[#96A2B8] hover:text-white"
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveTab("scanner")}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                activeTab === "scanner" ? "bg-[#171E2C] text-white text-semibold" : "text-[#96A2B8] hover:text-white"
              }`}
            >
              Scanner ({markets.length})
            </button>
            <button
              onClick={() => setActiveTab("reasoning")}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                activeTab === "reasoning" ? "bg-[#171E2C] text-white text-semibold" : "text-[#96A2B8] hover:text-white"
              }`}
            >
              Decision Ledger ({decisions.length})
            </button>
            <button
              onClick={() => setActiveTab("risk")}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                activeTab === "risk" ? "bg-[#171E2C] text-white text-semibold" : "text-[#96A2B8] hover:text-white"
              }`}
            >
              Risk Controls
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Health Indicator */}
          <div className="flex items-center space-x-2 text-2xs text-[#96A2B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C087] animate-pulse"></span>
            <span>RPC: {health?.solanaRpc.latencyMs ?? 18}ms</span>
          </div>

          {/* Agent State Pill */}
          <button
            onClick={handleToggleAgent}
            className={`px-2.5 py-1 text-2xs font-semibold rounded-xs flex items-center space-x-1.5 border transition-all ${
              telemetry?.state === "PAUSED"
                ? "bg-[#250308] border-[#FF4D64] text-[#FF4D64] hover:bg-[#FF4D64] hover:text-white"
                : "bg-[#022016] border-[#00C087] text-[#00C087] hover:bg-[#00C087] hover:text-black"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${telemetry?.state === "PAUSED" ? "bg-[#FF4D64]" : "bg-[#00C087]"}`} />
            <span>STATE: {telemetry?.state ?? "SCANNING"}</span>
          </button>

          {/* Global Emergency Kill-Switch */}
          <button
            onClick={() => setKillSwitchModalOpen(true)}
            className="px-2.5 py-1 text-2xs font-semibold rounded-xs bg-[#250308] border border-[#FF4D64] text-[#FF4D64] hover:bg-[#FF4D64] hover:text-white transition-colors flex items-center space-x-1"
          >
            <Power className="w-3 h-3" />
            <span>KILL SWITCH</span>
          </button>
        </div>
      </header>

      {/* 2. Secondary Telemetry Ribbon (The 5-Second Audit Bar) */}
      <section className="bg-[#0B0E14]/80 border-b border-[#2A3448]/40 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-[#96A2B8] text-2xs block uppercase tracking-wider">Total Equity</span>
            <span className="tabular-nums font-semibold text-white">
              ${portfolio?.totalEquityUsdc.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "10,428.50"} USDC
            </span>
          </div>
          <div>
            <span className="text-[#96A2B8] text-2xs block uppercase tracking-wider">24h PnL</span>
            <span
              className={`tabular-nums font-semibold flex items-center ${
                (portfolio?.realizedPnl24hPct ?? 0) >= 0 ? "text-[#00C087]" : "text-[#FF4D64]"
              }`}
            >
              +${portfolio?.realizedPnl24hUsdc.toFixed(2) ?? "428.50"} (+{portfolio?.realizedPnl24hPct.toFixed(2) ?? "4.28"}%)
            </span>
          </div>
          <div>
            <span className="text-[#96A2B8] text-2xs block uppercase tracking-wider">Allocated Capital</span>
            <span className="tabular-nums font-semibold text-white">
              ${portfolio?.allocatedCapitalUsdc.toFixed(2) ?? "1,000.00"} ({portfolio?.utilizationPct.toFixed(1) ?? "9.6"}%)
            </span>
          </div>
          <div>
            <span className="text-[#96A2B8] text-2xs block uppercase tracking-wider">Active Focus Pair</span>
            <span className="font-mono text-white font-semibold">
              {telemetry?.activeFocusPair ?? "SOL/USDC (Meteora DLMM)"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-2xs">
          <span className="bg-[#101520] text-[#96A2B8] px-2 py-1 rounded-xs border border-[#2A3448]">
            Max Trade: 10% ($1k)
          </span>
          <span className="bg-[#101520] text-[#96A2B8] px-2 py-1 rounded-xs border border-[#2A3448]">
            Max DD: -5.0%
          </span>
          <span className="bg-[#101520] text-[#96A2B8] px-2 py-1 rounded-xs border border-[#2A3448]">
            Max Slip: 50 bps
          </span>
        </div>
      </section>

      {/* 3. Primary 3-Column Workstation Grid */}
      <main className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden">
        {/* Left Column: Live Market Discovery Screener (3 cols) */}
        <div className="col-span-3 bg-[#0B0E14] border border-[#2A3448]/60 rounded-sm flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-[#2A3448]/60 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-[#00B4D8]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Market Discovery</h2>
            </div>
            <span className="text-2xs font-mono text-[#96A2B8]">{markets.length} Pools Scanned</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {markets.map((m) => (
              <div
                key={m.address}
                className="p-2.5 bg-[#101520] border border-[#2A3448]/40 hover:border-[#00B4D8]/60 rounded-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-white">{m.baseToken.symbol}/{m.quoteToken.symbol}</span>
                    <span className="text-2xs px-1 py-0.2 bg-[#171E2C] text-[#96A2B8] rounded-xs">
                      {m.venue === "METEORA_DLMM" ? "DLMM" : "AMM"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-2xs text-[#96A2B8]">Score:</span>
                    <span
                      className={`text-2xs font-mono font-bold px-1.5 py-0.5 rounded-xs ${
                        m.opportunityScore >= 75
                          ? "bg-[#022016] text-[#00C087] border border-[#00C087]/40"
                          : "bg-[#241602] text-[#F59E0B] border border-[#F59E0B]/40"
                      }`}
                    >
                      {m.opportunityScore}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 text-2xs text-[#96A2B8] tabular-nums">
                  <div>
                    <span className="block text-[10px]">Price</span>
                    <span className="text-white font-mono">${m.metrics.priceUsdc.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px]">24h Fee APR</span>
                    <span className="text-[#00C087] font-mono">{m.metrics.feeAprPct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px]">Depth</span>
                    <span className="text-white font-mono">${(m.metrics.liquidityDepthUsdc / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Execution Chart, Meteora Bin Inspector & Order Form (6 cols) */}
        <div className="col-span-6 flex flex-col space-y-3 overflow-hidden">
          {/* Main Chart Panel */}
          <div className="flex-1 bg-[#0B0E14] border border-[#2A3448]/60 rounded-sm flex flex-col overflow-hidden p-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A3448]/40 mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-sm text-white">SOL/USDC</span>
                <span className="text-xs text-[#00C087] font-mono font-semibold">$148.42 (+5.4%)</span>
                <span className="text-2xs text-[#96A2B8]">Meteora DLMM Active Bin #24810</span>
              </div>
              <div className="flex items-center space-x-1 text-2xs">
                <button className="px-2 py-0.5 bg-[#171E2C] text-white rounded-xs">15m</button>
                <button className="px-2 py-0.5 text-[#96A2B8] hover:text-white">1h</button>
                <button className="px-2 py-0.5 text-[#96A2B8] hover:text-white">4h</button>
              </div>
            </div>

            {/* Visualizer Frame */}
            <div className="flex-1 bg-[#101520] border border-[#2A3448]/40 rounded-xs p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-[#96A2B8]">
                <span>Order Flow Imbalance: <strong className="text-[#00C087] font-mono">+65% Buy Pressure</strong></span>
                <span>Active Bin Range: <strong className="text-white font-mono">$142.00 – $152.00</strong></span>
              </div>

              {/* Mock DLMM Bin Distribution */}
              <div className="h-32 flex items-end space-x-1.5 px-2 py-2">
                {[20, 35, 45, 75, 95, 100, 85, 60, 40, 25, 15].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-xs transition-all ${
                        i === 5 ? "bg-[#00B4D8]" : i < 5 ? "bg-[#00C087]/50" : "bg-[#FF4D64]/50"
                      }`}
                    ></div>
                    <span className="text-[9px] text-[#96A2B8] mt-1 font-mono">${144 + i}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-2xs text-[#96A2B8] border-t border-[#2A3448]/40 pt-2">
                <span>Green: Bid Liquidity Depth</span>
                <span className="text-[#00B4D8] font-semibold">Cyan: Active Execution Bin</span>
                <span>Red: Ask Liquidity Depth</span>
              </div>
            </div>
          </div>

          {/* Active Positions Table Panel */}
          <div className="h-44 bg-[#0B0E14] border border-[#2A3448]/60 rounded-sm flex flex-col overflow-hidden">
            <div className="p-2 border-b border-[#2A3448]/60 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00C087]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Active Positions ({positions.length})
                </h3>
              </div>
              <span className="text-2xs text-[#96A2B8]">Mark-to-Market (Per Block)</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-[#101520] text-2xs text-[#96A2B8] uppercase border-b border-[#2A3448]/40 sticky top-0">
                  <tr>
                    <th className="p-2">Pair</th>
                    <th className="p-2">Entry</th>
                    <th className="p-2">Current</th>
                    <th className="p-2">Size</th>
                    <th className="p-2">PnL</th>
                    <th className="p-2">SL / TP</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3448]/20 text-xs">
                  {positions.map((p) => (
                    <tr key={p.id} className="hover:bg-[#101520]/50">
                      <td className="p-2 font-bold text-white font-mono">{p.pairSymbol}</td>
                      <td className="p-2 font-mono">${p.entryPriceUsdc.toFixed(2)}</td>
                      <td className="p-2 font-mono">${p.currentPriceUsdc.toFixed(2)}</td>
                      <td className="p-2 font-mono">${p.sizeUsdc.toFixed(0)}</td>
                      <td className="p-2 font-mono font-semibold text-[#00C087]">
                        +${p.unrealizedPnlUsdc.toFixed(2)} (+{p.unrealizedPnlPct.toFixed(2)}%)
                      </td>
                      <td className="p-2 font-mono text-2xs text-[#96A2B8]">
                        ${p.stopLossPriceUsdc.toFixed(2)} / ${p.takeProfitPriceUsdc.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        <button className="px-2 py-0.5 bg-[#250308] border border-[#FF4D64]/60 text-[#FF4D64] hover:bg-[#FF4D64] hover:text-white rounded-xs text-2xs font-semibold transition-colors">
                          Unwind
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI Reasoning & Decision Ledger (3 cols) */}
        <div className="col-span-3 bg-[#0B0E14] border border-[#2A3448]/60 rounded-sm flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-[#2A3448]/60 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-[#00C087]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Decision Ledger</h2>
            </div>
            <span className="text-2xs font-mono text-[#96A2B8]">Immutable Log</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
            {decisions.map((d) => (
              <div key={d.id} className="p-2.5 bg-[#101520] border border-[#2A3448]/50 rounded-xs text-xs space-y-1.5">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-mono text-[#96A2B8]">{new Date(d.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded-xs ${
                      d.riskVerdict === "APPROVED"
                        ? "bg-[#022016] text-[#00C087] border border-[#00C087]/40"
                        : "bg-[#250308] text-[#FF4D64] border border-[#FF4D64]/40"
                    }`}
                  >
                    {d.riskVerdict}: {d.decision.action}
                  </span>
                </div>

                <div className="font-bold text-white flex justify-between items-center">
                  <span>{d.pairSymbol}</span>
                  <span className="text-2xs text-[#00B4D8] font-mono">Score: {d.score}/100</span>
                </div>

                <p className="text-2xs text-[#96A2B8] leading-relaxed line-clamp-3">{d.decision.entryReason}</p>

                <div className="flex flex-wrap gap-1 pt-1 border-t border-[#2A3448]/30 text-[10px]">
                  {d.decision.signals.map((s, idx) => (
                    <span key={idx} className="bg-[#171E2C] text-[#DCDEE5] px-1 py-0.2 rounded-xs font-mono">
                      {s.name}: {s.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 4. Global Emergency Kill Switch Modal Dialog */}
      {killSwitchModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B0E14] border border-[#FF4D64] rounded-sm max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-[#FF4D64]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold uppercase">Emergency Kill Switch Activated</h3>
            </div>

            <p className="text-xs text-[#DCDEE5] leading-relaxed">
              Triggering the kill-switch immediately suspends all autonomous agent execution loops across Solana. Choose
              your resolution path:
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handlePanicKill(false)}
                className="w-full py-2.5 px-3 bg-[#171E2C] hover:bg-[#2A3448] text-white rounded-xs text-xs font-semibold text-left flex justify-between items-center transition-colors"
              >
                <span>1. Halt Agent Only (Preserve Open Positions)</span>
                <span className="text-2xs text-[#96A2B8]">Freeze Loops</span>
              </button>

              <button
                onClick={() => handlePanicKill(true)}
                className="w-full py-2.5 px-3 bg-[#250308] border border-[#FF4D64] hover:bg-[#FF4D64] text-[#FF4D64] hover:text-white rounded-xs text-xs font-bold text-left flex justify-between items-center transition-colors"
              >
                <span>2. Panic Unwind All to USDC + Halt</span>
                <span className="text-2xs uppercase">Liquidate All</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setKillSwitchModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#96A2B8] hover:text-white"
              >
                Cancel / Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
