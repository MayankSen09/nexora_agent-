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
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
} from "lucide-react";
import { AgentTelemetry, GetSystemHealthResponse, PortfolioSummary } from "@nexora/shared";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
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
    ? "text-rose-400 bg-rose-950/60 border-rose-800/60"
    : isExecuting
    ? "text-amber-400 bg-amber-950/60 border-amber-800/60"
    : "text-emerald-400 bg-emerald-950/60 border-emerald-800/60";

  const stateDot = isPaused
    ? "bg-rose-500 animate-pulse"
    : isExecuting
    ? "bg-amber-400 animate-ping"
    : "bg-emerald-400 animate-pulse";

  const navItems = [
    { id: "dashboard", label: "Terminal", icon: TerminalIcon },
    { id: "scanner", label: "Scanner", icon: Compass },
    { id: "reasoning", label: "Reasoning", icon: FileText },
    { id: "positions", label: "Positions", icon: Briefcase },
    { id: "portfolio", label: "Portfolio", icon: TrendingUp },
    { id: "history", label: "History", icon: Layers },
    { id: "risk", label: "Risk Shield", icon: Shield },
    { id: "agent", label: "Agent", icon: Zap },
    { id: "transactions", label: "Transactions", icon: Activity },
    { id: "health", label: "System Health", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "landing", label: "Overview", icon: Layers },
  ];

  const deployedCapital = telemetry?.deployedCapitalUsdc ?? 1000;
  const totalEquity = portfolio?.totalEquityUsdc ?? 10428.5;
  const capitalUtilizationPct = totalEquity > 0 ? (deployedCapital / totalEquity) * 100 : 0;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Top Bar: Brand, State Ribbon, Telemetry, Health, Kill-Switch */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-slate-800/40 gap-3">
        {/* Left: Brand & Mode */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-emerald-500 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wider text-slate-100 font-mono">
                  NEXORA
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 rounded font-mono font-semibold">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Autonomous Capital Allocation
              </div>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Environment Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {telemetry?.environment || "DEVNET"}
            </span>
          </div>

          {/* Help / Guide */}
          <button
            onClick={onOpenOnboarding}
            className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 px-2 py-1 rounded transition-colors font-mono"
          >
            <span>Docs & Tour</span>
          </button>
        </div>

        {/* Center: Live Operational Ribbon */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-3 py-1 rounded-md text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">State:</span>
            <span
              className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center gap-1.5 ${stateColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stateDot}`} />
              {telemetry?.state || "SCANNING"}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px]">Cycle:</span>
            <span className="text-slate-200 tabular-nums font-semibold">
              #{telemetry?.currentCycle || 1428}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px]">Focus:</span>
            <span className="text-cyan-400 font-semibold">
              {telemetry?.activeFocusPair || "SOL/USDC"}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          {/* Capital Utilization Meter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Deployed:</span>
            <span className="text-slate-200 tabular-nums">
              ${deployedCapital.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-slate-500 text-[10px] ml-1">
                ({capitalUtilizationPct.toFixed(1)}%)
              </span>
            </span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, capitalUtilizationPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Telemetry, RPC Latency, Toggle & Emergency Kill Switch */}
        <div className="flex items-center gap-2">
          {/* Health Badge */}
          <div
            onClick={() => setActiveTab("health")}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition-colors"
            title="Solana Devnet RPC Ping & Invariant Monitor"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[11px]">RPC:</span>
            <span className="text-emerald-400 tabular-nums font-medium text-[11px]">
              {health?.solanaRpc?.latencyMs ? `${health.solanaRpc.latencyMs}ms` : "18ms"}
            </span>
          </div>

          {/* Start / Pause Toggle */}
          <button
            onClick={onToggleAgent}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              isPaused
                ? "bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isPaused ? "RESUME AGENT" : "PAUSE"}</span>
          </button>

          {/* Emergency Kill-Switch */}
          <button
            onClick={onOpenKillSwitch}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 hover:border-rose-600 text-rose-300 transition-all shadow-sm shadow-rose-950"
            title="Emergency Zero-Delay Policy Circuit Breaker"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="tracking-wide">KILL-SWITCH</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Strip */}
      <div className="flex items-center px-4 overflow-x-auto no-scrollbar gap-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
