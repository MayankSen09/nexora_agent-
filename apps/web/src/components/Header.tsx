import React from "react";
import {
  Shield,
  Activity,
  Zap,
  Power,
  Layers,
  Terminal as TerminalIcon,
  Compass,
  FileText,
  Briefcase,
  TrendingUp,
  Settings,
  AlertTriangle,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { AgentTelemetry, GetSystemHealthResponse, PortfolioSummary } from "@nexora/shared";
import { formatCurrency, formatPercent } from "@nexora/ui";

export type TerminalTabId =
  | "dashboard"
  | "scanner"
  | "reasoning"
  | "positions"
  | "portfolio"
  | "history"
  | "risk"
  | "agent"
  | "transactions"
  | "health"
  | "settings"
  | "landing";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: TerminalTabId) => void;
  telemetry: AgentTelemetry | null;
  portfolio: PortfolioSummary | null;
  health: GetSystemHealthResponse | null;
  onToggleAgent: () => void;
  onOpenKillSwitch: () => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  portfolio,
  health,
  onToggleAgent,
  onOpenKillSwitch,
  onOpenOnboarding,
}) => {
  const isPaused = telemetry?.state === "PAUSED" || telemetry?.emergencyStopped;
  const isExecuting = telemetry?.state === "EXECUTING";

  const stateColor = isPaused
    ? "text-rose-400 bg-rose-950/80 border-rose-800"
    : isExecuting
    ? "text-amber-400 bg-amber-950/80 border-amber-800"
    : "text-emerald-400 bg-emerald-950/80 border-emerald-800";

  const stateDot = isPaused
    ? "bg-rose-500"
    : isExecuting
    ? "bg-amber-400"
    : "bg-emerald-400";

  const primaryNavItems: Array<{ id: TerminalTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "dashboard", label: "Terminal", icon: TerminalIcon },
    { id: "scanner", label: "Scanner", icon: Compass },
    { id: "reasoning", label: "Reasoning", icon: FileText },
    { id: "positions", label: "Positions", icon: Briefcase },
    { id: "portfolio", label: "Portfolio", icon: TrendingUp },
    { id: "history", label: "History", icon: Layers },
    { id: "risk", label: "Risk Shield", icon: Shield },
    { id: "agent", label: "Agent", icon: Zap },
    { id: "transactions", label: "Transactions", icon: Activity },
    { id: "health", label: "Health", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "landing", label: "Overview", icon: Layers },
  ];

  const deployedCapital = telemetry?.deployedCapitalUsdc ?? 1000;
  const totalEquity = portfolio?.totalEquityUsdc ?? 10428.5;
  const capitalUtilizationPct = totalEquity > 0 ? (deployedCapital / totalEquity) * 100 : 0;
  const realized24hPnl = portfolio?.realizedPnl24hUsdc ?? 385.7;

  return (
    <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-40 select-none">
      {/* Top Bar: Brand, State Ribbon, Telemetry, Health, Kill-Switch */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800/60 gap-2 sm:gap-3">
        {/* Left: Brand & Mode */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2 cursor-pointer group"
            title="Return to Protocol Overview"
          >
            <div className="w-7 h-7 rounded-sm bg-slate-900 border border-cyan-500/60 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-xs tracking-wider text-slate-100 font-mono">
                  NEXORA
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-cyan-950 border border-cyan-800/80 text-cyan-400 rounded-xs font-mono font-semibold">
                  v1.0
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5 hidden xs:block">
                Quantitative Terminal
              </div>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Environment Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm p-0.5 text-xs font-mono">
            <span className="px-1.5 py-0.5 rounded-xs bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {telemetry?.environment || "DEVNET"}
            </span>
          </div>

          {/* Docs / Tour */}
          <button
            onClick={onOpenOnboarding}
            aria-label="Open architecture guide and tour"
            className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded-sm transition-colors font-mono"
          >
            <span>Guide & Tour</span>
          </button>
        </div>

        {/* Center: Live Operational Telemetry Ribbon */}
        <div className="hidden lg:flex items-center gap-3.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-sm text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[9px] font-semibold">STATE:</span>
            <span
              className={`px-1.5 py-0.2 rounded-xs border text-[10px] font-bold flex items-center gap-1 ${stateColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stateDot}`} />
              {telemetry?.state || "SCANNING"}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1">
            <span className="text-slate-500 uppercase text-[9px]">CYCLE:</span>
            <span className="text-slate-200 tabular-nums font-semibold text-[11px]">
              #{telemetry?.currentCycle || 1428}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1">
            <span className="text-slate-500 uppercase text-[9px]">FOCUS:</span>
            <span className="text-cyan-400 font-semibold text-[11px]">
              {telemetry?.activeFocusPair || "SOL/USDC"}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          {/* Capital Utilization Meter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[9px]">DEPLOYED:</span>
            <span className="text-slate-200 tabular-nums text-[11px]">
              {formatCurrency(deployedCapital, 0)}
              <span className="text-slate-500 text-[10px] ml-1">
                ({capitalUtilizationPct.toFixed(1)}%)
              </span>
            </span>
            <div className="w-14 h-1 bg-slate-800 rounded-none overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${Math.min(100, capitalUtilizationPct * 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Telemetry, RPC Latency, Toggle & Emergency Kill Switch */}
        <div className="flex items-center gap-2">
          {/* 24h PnL Pill */}
          <div
            onClick={() => setActiveTab("portfolio")}
            className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-900 border border-slate-800 cursor-pointer text-xs font-mono hover:border-slate-700 transition-colors"
            title="Session 24h PnL"
          >
            <span className="text-slate-500 text-[10px]">24h:</span>
            <span className={`text-[10px] font-bold tabular-nums ${realized24hPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(realized24hPnl, 2, true)}
            </span>
          </div>

          {/* Health Badge */}
          <div
            onClick={() => setActiveTab("health")}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition-colors"
            title="Solana Devnet RPC Invariant Ping"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500 text-[10px]">RPC:</span>
            <span className="text-emerald-400 tabular-nums font-semibold text-[10px]">
              {health?.solanaRpc?.latencyMs ? `${health.solanaRpc.latencyMs}ms` : "18ms"}
            </span>
          </div>

          {/* Start / Pause Toggle */}
          <button
            onClick={onToggleAgent}
            aria-label={isPaused ? "Resume autonomous trading loop" : "Pause autonomous trading loop"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors ${
              isPaused
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isPaused ? "RESUME" : "PAUSE"}</span>
          </button>

          {/* Emergency Kill-Switch */}
          <button
            onClick={onOpenKillSwitch}
            aria-label="Engage emergency kill switch and pause agent"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-bold bg-rose-950 hover:bg-rose-900 border border-rose-700 hover:border-rose-500 text-rose-200 transition-colors"
            title="Emergency Zero-Delay Policy Circuit Breaker"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span className="tracking-wide">KILL-SWITCH</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Strip (Crisp High-Density Tabs) */}
      <nav aria-label="Terminal Navigation" className="flex items-center px-2 sm:px-4 overflow-x-auto no-scrollbar gap-1 py-1 border-t border-slate-900 bg-slate-950">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-slate-850 text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
