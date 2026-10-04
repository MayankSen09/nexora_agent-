import React, { useState } from "react";
import {
  Shield,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Lock,
  RefreshCw,
  Save,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { PROTOCOL_CONSTANTS, RiskEvent } from "@nexora/shared";

interface RiskControlsViewProps {
  onOpenKillSwitch: () => void;
}

export const RiskControlsView: React.FC<RiskControlsViewProps> = ({ onOpenKillSwitch }) => {
  const [maxPositionPct, setMaxPositionPct] = useState(5.0);
  const [maxDailyLossPct, setMaxDailyLossPct] = useState(3.0);
  const [maxTokenExposurePct, setMaxTokenExposurePct] = useState(10.0);
  const [maxSlippageBps, setMaxSlippageBps] = useState(50);
  const [minLiquidityUsd, setMinLiquidityUsd] = useState(50000);
  const [maxOpenPositions, setMaxOpenPositions] = useState(5);
  const [maxSingleTradeUsd, setMaxSingleTradeUsd] = useState(1000);
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePolicy = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const riskEvents: RiskEvent[] = [
    {
      id: "risk-evt-102",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      eventType: "INVARIANT_BREACH",
      severity: "HIGH",
      reasonCode: "RISK_HIGH_VOLATILITY",
      details: "Jupiter BONK/USDC rejected: 1h realized volatility (4.8%) exceeds max threshold (4.0%).",
      actionTaken: "REJECTED_TRADE",
    },
    {
      id: "risk-evt-101",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      eventType: "INVARIANT_BREACH",
      severity: "LOW",
      reasonCode: "RISK_POSITION_TOO_LARGE",
      details: "Proposed size $1,250.00 USDC automatically clamped to $1,000.00 USDC max invariant.",
      actionTaken: "REJECTED_TRADE",
    },
    {
      id: "risk-evt-100",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      eventType: "KILL_SWITCH_ENGAGED",
      severity: "LOW",
      reasonCode: "RISK_POLICY_DISABLED",
      details: "Deterministic Rust Risk Engine policy envelope initialized with zero-bypass constraints.",
      actionTaken: "ALERTED_ONLY",
    },
  ];

  return (
    <div className="space-y-6 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header & Quick Emergency Action */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>ZERO-BYPASS RISK SHIELD</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Cryptographic & Hard Mathematical Invariants
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ENFORCEMENT: ACTIVE</span>
          </div>

          <button
            onClick={onOpenKillSwitch}
            className="px-3 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>KILL SWITCH</span>
          </button>
        </div>
      </div>

      {/* 2. Policy Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Interactive Invariant Sliders */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>HARD INVARIANT POLICY ENVELOPE</span>
            </span>
            <span className="text-[10px] text-slate-500">Local Rust Enforcement</span>
          </div>

          <div className="space-y-4">
            {/* Max Position Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Max Position Size (% Equity):</span>
                <span className="text-cyan-400 font-bold tabular-nums">{maxPositionPct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={maxPositionPct}
                onChange={(e) => setMaxPositionPct(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                AI requests exceeding this limit are clamped automatically.
              </div>
            </div>

            {/* Daily Drawdown Limit */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Daily Drawdown Circuit Breaker:</span>
                <span className="text-rose-400 font-bold tabular-nums">-{maxDailyLossPct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={maxDailyLossPct}
                onChange={(e) => setMaxDailyLossPct(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                Trading freezes for 24h if session equity drops by this threshold.
              </div>
            </div>

            {/* Max Slippage */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Maximum Slippage Tolerance:</span>
                <span className="text-amber-400 font-bold tabular-nums">{maxSlippageBps} bps ({(maxSlippageBps / 100).toFixed(2)}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={maxSlippageBps}
                onChange={(e) => setMaxSlippageBps(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                Jupiter/Meteora routes with higher simulated slippage abort immediately.
              </div>
            </div>

            {/* Min Liquidity */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Minimum Pool Liquidity (USD):</span>
                <span className="text-slate-100 font-bold tabular-nums">${minLiquidityUsd.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="250000"
                step="10000"
                value={minLiquidityUsd}
                onChange={(e) => setMinLiquidityUsd(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                Protects against low-liquidity micro-cap manipulation.
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePolicy}
              className={`w-full py-2.5 rounded font-bold transition-all flex items-center justify-center gap-2 ${
                isSaved
                  ? "bg-emerald-600 text-slate-950 font-bold"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? "POLICY ENFORCED SUCCESSFULLY" : "SAVE & COMMIT RISK POLICY"}</span>
            </button>
          </div>
        </div>

        {/* Right: Active Invariant Status & Rejections */}
        <div className="space-y-4">
          {/* Active Status Badges */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-2">
              ACTIVE DEFENSE LAYERS
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">1. Freshness Guard (&le; 15s Data)</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">2. AI Confidence Gating (&ge; 70%)</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">3. Token Freeze Authority Check</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">4. Pre-Flight RPC Simulation</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">5. Anchor PDA Owner Withdrawal Isolation</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
            </div>
          </div>

          {/* Rejection Statistics */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-2">
              SESSION INTERVENTION REASONS
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>RISK_HIGH_VOLATILITY:</span>
                <span className="text-amber-400 font-bold">4 Rejections</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RISK_HIGH_SLIPPAGE:</span>
                <span className="text-amber-400 font-bold">2 Rejections</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RISK_POSITION_TOO_LARGE:</span>
                <span className="text-cyan-400 font-bold">3 Clamped</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RISK_LOW_LIQUIDITY:</span>
                <span className="text-slate-500">0 Rejections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Risk Events Feed */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>RECENT RISK INTERVENTION AUDIT LOG</span>
          <span className="text-slate-500 text-[10px]">Zero-Bypass Trail</span>
        </div>

        <div className="space-y-2">
          {riskEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-slate-400">{evt.id}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400">{evt.reasonCode}</span>
                </div>
                <span className="text-slate-500 tabular-nums">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-snug">{evt.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
