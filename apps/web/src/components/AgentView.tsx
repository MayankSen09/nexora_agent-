import React, { useState } from "react";
import {
  Zap,
  Activity,
  Shield,
  Clock,
  Cpu,
  RefreshCw,
  Power,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Sliders,
  Terminal,
} from "lucide-react";
import { AgentTelemetry, PROTOCOL_CONSTANTS } from "@nexora/shared";

interface AgentViewProps {
  telemetry: AgentTelemetry | null;
  onToggleAgent: () => void;
  onOpenKillSwitch: () => void;
}

export const AgentView: React.FC<AgentViewProps> = ({
  telemetry,
  onToggleAgent,
  onOpenKillSwitch,
}) => {
  const [cycleIntervalSec, setCycleIntervalSec] = useState(15);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [logFilter, setLogFilter] = useState<"ALL" | "DECISION" | "RISK" | "EXEC">("ALL");

  const currentState = telemetry?.state || "SCANNING";
  const isPaused = currentState === "PAUSED" || telemetry?.emergencyStopped;

  const states = [
    { id: "IDLE", label: "01. IDLE", desc: "Awaiting next scheduled cycle trigger" },
    { id: "SCANNING", label: "02. SCANNING", desc: "Polling Solana DLMM & Jupiter pools" },
    { id: "ANALYZING", label: "03. ANALYZING", desc: "Generating 10-factor opportunity vector" },
    { id: "DECISION", label: "04. DECISION", desc: "Gemini Structured Hypothesis Inference" },
    { id: "RISK_CHECK", label: "05. RISK_CHECK", desc: "Deterministic Invariant Validation (Rust)" },
    { id: "EXECUTION", label: "06. EXECUTION", desc: "Pre-flight simulation & atomic DEX swap" },
    { id: "MONITORING", label: "07. MONITORING", desc: "Trailing stops & active DLMM bin tracking" },
    { id: "EXITING", label: "08. EXITING", desc: "Take-Profit / Invalidation Unwind" },
  ];

  const logs = [
    { time: "22:42:10", type: "INFO", text: "Cycle #1428 started: Polling 14 Solana DLMM pools." },
    { time: "22:42:11", type: "INFO", text: "Candidate market detected: Meteora SOL/USDC (Score: 88.4)." },
    { time: "22:42:12", type: "DECISION", text: "AI Hypothesis generated: BUY 9.5% equity. Confidence: 88%." },
    { time: "22:42:12", type: "RISK", text: "Risk Engine Invariant Check: PASSED. Clamped to $1,000.00 USDC." },
    { time: "22:42:13", type: "EXEC", text: "Solana Simulation Successful. Consumed 148,200 CU. Tx Broadcasted." },
    { time: "22:42:14", type: "EXEC", text: "Confirmed on Devnet slot 312,849,180. Tx Sig: 5Kj8b3Z..." },
    { time: "22:42:18", type: "INFO", text: "Position pos-001 active. Trailing stop initialized at $145.45." },
  ];

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "ALL") return true;
    if (logFilter === "DECISION") return l.type === "DECISION";
    if (logFilter === "RISK") return l.type === "RISK";
    if (logFilter === "EXEC") return l.type === "EXEC";
    return true;
  });

  return (
    <div className="space-y-6 font-mono max-w-7xl mx-auto">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800">
        <div>
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
            AUTONOMOUS STATE MACHINE
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Agent Controller Telemetry</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
              {telemetry?.agentId || "agent-nexora-alpha-01"}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAgent}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
              isPaused
                ? "bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? "RESUME AUTONOMOUS LOOP" : "PAUSE LOOP"}</span>
          </button>

          <button
            onClick={onOpenKillSwitch}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>EMERGENCY FREEZE</span>
          </button>
        </div>
      </div>

      {/* 2. 8-Stage Autonomous Lifecycle Inspector */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200">
            STATE MACHINE LIFECYCLE (9-PHASE FINITE AUTOMATON)
          </span>
          <span className="text-[11px] text-slate-400">
            Active: <span className="text-emerald-400 font-bold">{currentState}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {states.map((st) => {
            const isActive = currentState === st.id;
            return (
              <div
                key={st.id}
                className={`p-3 rounded border transition-all text-xs ${
                  isActive
                    ? "bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950/40"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={isActive ? "text-emerald-300" : "text-slate-300"}>
                    {st.label}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Submodule Latency Breakdown & Pipeline Timing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency Waterfall */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200">
              PIPELINE SUBMODULE LATENCIES
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">
              Total: 1,604 ms
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>01. Market Discovery & Cache Ingest</span>
                <span className="tabular-nums font-bold">
                  {telemetry?.submoduleLatencies.discoveryMs || 42} ms
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[4%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>02. 10-Factor Feature Vector Extraction</span>
                <span className="tabular-nums font-bold">
                  {telemetry?.submoduleLatencies.featuresMs || 18} ms
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-[2%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>03. AI Structured Decision (Gemini 2.5 Flash)</span>
                <span className="tabular-nums font-bold text-cyan-400">
                  {telemetry?.submoduleLatencies.inferenceMs || 1420} ms
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[88%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>04. Deterministic Risk Engine Invariants</span>
                <span className="tabular-nums font-bold text-emerald-400">
                  {telemetry?.submoduleLatencies.riskEngineMs || 4} ms
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[1%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>05. Pre-Flight RPC Simulation & Quote</span>
                <span className="tabular-nums font-bold">
                  {telemetry?.submoduleLatencies.simulationMs || 120} ms
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full w-[8%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-2 font-bold text-slate-200">
            AGENT EXECUTION PARAMETERS
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Scan Cycle Frequency:</span>
              <span className="text-cyan-400 font-bold">{cycleIntervalSec} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={cycleIntervalSec}
              onChange={(e) => setCycleIntervalSec(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>High Frequency (5s)</span>
              <span>Standard (15s)</span>
              <span>Conservative (60s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-slate-300">AI Reasoning Provider:</div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended - 1.4s)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning - 3.2s)</option>
              <option value="gpt-4o">OpenAI GPT-4o Mini (1.8s)</option>
              <option value="mock-deterministic">Mock Deterministic Engine (Zero Latency Testing)</option>
            </select>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
            <span className="text-emerald-400 font-bold">Safety Guarantee:</span> Invariant verification runs locally in native sub-millisecond code. AI inference failure defaults to <code className="text-rose-400">DO NOT TRADE</code>.
          </div>
        </div>
      </div>

      {/* 4. Live Agent Event Log Stream */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>REAL-TIME AGENT TELEMETRY FEED</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-0.5 text-[11px]">
            {(["ALL", "DECISION", "RISK", "EXEC"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  logFilter === filter
                    ? "bg-slate-800 text-cyan-400 font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredLogs.map((l, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-[11px]"
            >
              <span className="text-slate-500 tabular-nums">{l.time}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  l.type === "RISK"
                    ? "bg-amber-950 text-amber-400 border border-amber-800/80"
                    : l.type === "DECISION"
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800/80"
                    : l.type === "EXEC"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/80"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {l.type}
              </span>
              <span className="text-slate-300 flex-1">{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
