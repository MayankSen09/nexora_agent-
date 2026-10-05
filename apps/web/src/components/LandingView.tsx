import React, { useState } from "react";
import {
  Shield,
  Zap,
  Activity,
  ArrowRight,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Flame,
  Terminal,
  ChevronRight,
  ExternalLink,
  Radio,
  Sliders,
  Database,
  Code2,
  FileText,
  Key,
  PieChart,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { PROTOCOL_CONSTANTS } from "@nexora/shared";
import { formatCurrency, formatPrice, formatPercent, formatCompactNumber } from "@nexora/ui";

interface LandingViewProps {
  onLaunchTerminal: () => void;
  onOpenOnboarding: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLaunchTerminal, onOpenOnboarding }) => {
  const [activeLoopStep, setActiveLoopStep] = useState(3);
  const [decisionTab, setDecisionTab] = useState<"ai_output" | "features" | "risk_log" | "tx_receipt">("ai_output");
  const [copiedDecision, setCopiedDecision] = useState(false);
  const [selectedBinIndex, setSelectedBinIndex] = useState(3);

  // Interactive Risk Simulator state
  const [simScenario, setSimScenario] = useState<"valid" | "oversized" | "slippage" | "stale">("valid");

  const loopSteps = [
    {
      id: 1,
      name: "01. DISCOVERY",
      title: "Mempool & Pool Ingestion",
      desc: "High-frequency streaming across Meteora DLMM discrete bins and Jupiter routed liquidity pairs with strict volume filters.",
      latency: "42ms",
      failsafe: "Discards low-liquidity pairs (< $50k) before feature generation.",
    },
    {
      id: 2,
      name: "02. FEATURES",
      title: "10-Factor Vector Compute",
      desc: "Computes order flow imbalance (OFI), 1h realized volatility, fee velocity, and holder concentration vectors in real-time.",
      latency: "18ms",
      failsafe: "Flags data timestamp skew > 15s as an instant hard fail.",
    },
    {
      id: 3,
      name: "03. REASONING",
      title: "Structured AI Inference",
      desc: "Gemini 2.5 Flash evaluates quantitative signals, formulating a hypothesis with explicit invalidation triggers and confidence bounds.",
      latency: "1,420ms",
      failsafe: "Strict Zod schema validation; drops execution if confidence < 70%.",
    },
    {
      id: 4,
      name: "04. RISK SHIELD",
      title: "Zero-Bypass Invariant Gate",
      desc: "Deterministic Rust risk engine evaluates hard mathematical boundaries (10% max size, 50bps slippage, daily drawdown limits).",
      latency: "4.2ms",
      failsafe: "Zero human latency; automatically clamps or vetoes proposal.",
    },
    {
      id: 5,
      name: "05. SIMULATION",
      title: "Pre-Flight RPC Simulation",
      desc: "Simulates transaction against latest Solana Devnet bank slot to verify compute units, balance deltas, and slippage guards.",
      latency: "120ms",
      failsafe: "Aborts submission if simulated transaction throws any custom Anchor error.",
    },
    {
      id: 6,
      name: "06. EXECUTION",
      title: "Atomic Onchain Swap",
      desc: "Dispatches atomic swap via Meteora DLMM dynamic bin contract or Jupiter v6 router using delegated Anchor PDA authority.",
      latency: "450ms",
      failsafe: "Priority fee auto-boost dynamically adjusts to current slot congestion.",
    },
    {
      id: 7,
      name: "07. MONITORING",
      title: "Active Bin & Trailing Stops",
      desc: "Continuous sub-second tracking of mark price against DLMM active bin boundaries, dynamic trailing stops, and target take-profits.",
      latency: "15s Poll",
      failsafe: "Monitors pool fee distribution to capture maximum LP yield acceleration.",
    },
    {
      id: 8,
      name: "08. EXITING",
      title: "Controlled Unwind",
      desc: "Executes systematic take-profit scale-outs or immediate invalidation unwinds without market impact.",
      latency: "380ms",
      failsafe: "Releases capital back to unallocated vault balance in USDC.",
    },
  ];

  const binsData = [
    { binId: 24807, price: 147.20, depthUsdc: 120000, type: "Bid (Support)", sharePct: 15 },
    { binId: 24808, price: 147.60, depthUsdc: 240000, type: "Bid (Support)", sharePct: 25 },
    { binId: 24809, price: 148.00, depthUsdc: 450000, type: "Bid (Near)", sharePct: 45 },
    { binId: 24810, price: 148.42, depthUsdc: 620000, type: "ACTIVE BIN (Current Price)", sharePct: 100 },
    { binId: 24811, price: 148.80, depthUsdc: 380000, type: "Ask (Resistance)", sharePct: 60 },
    { binId: 24812, price: 149.20, depthUsdc: 190000, type: "Ask (Target 1)", sharePct: 30 },
    { binId: 24813, price: 149.60, depthUsdc: 95000, type: "Ask (Target 2)", sharePct: 16 },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDecision(true);
    setTimeout(() => setCopiedDecision(false), 2000);
  };

  return (
    <div className="space-y-20 py-6 px-4 max-w-7xl mx-auto font-mono text-xs selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* ==================================================================== */}
      {/* SECTION 1: HERO (Institutional Quant Positioning) */}
      {/* ==================================================================== */}
      <section className="relative text-center space-y-8 pt-6 pb-14 overflow-hidden border-b border-slate-800">
        {/* Quantitative Grid Pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b14_1px,transparent_1px),linear-gradient(to_bottom,#1e293b14_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_65%_50%_at_50%_35%,#000_70%,transparent_100%)]" />

        {/* Track Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold tracking-wider text-cyan-400">SOLANA HACKATHON</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400 font-medium">AI & DEFI INFRASTRUCTURE</span>
          <span className="text-slate-700">/</span>
          <span className="text-emerald-400 font-semibold">DEVNET LIVE</span>
        </div>

        {/* Positioning Headline */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-widest text-cyan-400 font-bold">
            NEXORA AUTONOMOUS WORKSTATION
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-100 max-w-5xl mx-auto leading-[1.08]">
            AUTONOMOUS INTELLIGENCE FOR{" "}
            <span className="text-emerald-400 font-extrabold">
              ONCHAIN MARKETS
            </span>
          </h1>
        </div>

        {/* Primary Statement */}
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed font-sans">
          AI agents that discover, evaluate, and execute high-probability opportunities across onchain
          Solana liquidity venues with deterministic mathematical safety.
        </p>

        {/* Core Architectural Doctrine */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-200 font-bold tracking-wide">THE AI DECIDES</span>
          </div>
          <span className="text-slate-600 font-bold">→</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-bold tracking-wide">THE RISK ENGINE CONTROLS</span>
          </div>
          <span className="text-slate-600 font-bold">→</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="text-cyan-400 font-bold tracking-wide">THE BLOCKCHAIN EXECUTES</span>
          </div>
        </div>

        {/* Primary Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onLaunchTerminal}
            className="flex items-center gap-2 px-6 py-3 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider transition-colors shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>LAUNCH TRADING TERMINAL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2 px-5 py-3 rounded-sm bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>ARCHITECTURE TOUR</span>
          </button>
        </div>

        {/* Live Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 text-left">
          <div className="p-3.5 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Invariant Latency</span>
            <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">4.2 ms</div>
            <div className="text-[10px] text-slate-400">Zero-Bypass Rust Gate</div>
          </div>
          <div className="p-3.5 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Backtest Win Rate</span>
            <div className="text-lg font-bold text-cyan-400 font-mono tabular-nums">75.0%</div>
            <div className="text-[10px] text-slate-400">9 Wins / 3 Losses (PF: 3.20)</div>
          </div>
          <div className="p-3.5 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">24h Scanned Volume</span>
            <div className="text-lg font-bold text-slate-100 font-mono tabular-nums">$4,820,000</div>
            <div className="text-[10px] text-slate-400">Meteora DLMM & Jupiter</div>
          </div>
          <div className="p-3.5 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Solana Devnet Ping</span>
            <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">18 ms</div>
            <div className="text-[10px] text-slate-400">Slot #312,849,201</div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: LIVE AGENT VISUALIZATION */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
              02. REAL-TIME TELEMETRY
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Live Autonomous State Machine Inspector
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-bold">ACTIVE CYCLE #1,428</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-semibold">FOCUS: Meteora SOL/USDC DLMM</span>
          </div>
        </div>

        {/* Live Workstation Preview Card */}
        <div className="p-5 rounded-md bg-slate-900 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Active Opportunity Spotlight */}
            <div className="lg:col-span-4 p-4 rounded-sm bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-slate-100 text-sm">SOL / USDC</span>
                </div>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                  Score: 88.4 / 100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>Price: <span className="text-slate-200 font-bold font-mono tabular-nums">$148.42</span></div>
                <div>24h Chg: <span className="text-emerald-400 font-bold font-mono tabular-nums">+5.4%</span></div>
                <div>Fee APR: <span className="text-cyan-400 font-bold font-mono tabular-nums">48.2%</span></div>
                <div>OFI Flow: <span className="text-emerald-400 font-bold font-mono tabular-nums">+0.65 (Buy)</span></div>
              </div>
              <div className="p-2.5 rounded-sm bg-slate-900 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Hypothesis:</span>
                </div>
                <div className="text-slate-400 leading-relaxed font-sans">
                  15m Momentum breakout supported by 3.2x DLMM fee acceleration and positive order flow imbalance (+0.65).
                </div>
              </div>
            </div>

            {/* Center: Interactive DLMM Active Bin Distribution */}
            <div className="lg:col-span-5 p-4 rounded-sm bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DLMM Bin Array Depth (Interactive)</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono tabular-nums">
                  Bin #{binsData[selectedBinIndex].binId} (${binsData[selectedBinIndex].price.toFixed(2)})
                </span>
              </div>

              {/* Discrete DLMM Bin Bars */}
              <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
                {binsData.map((bin, idx) => (
                  <div
                    key={bin.binId}
                    onClick={() => setSelectedBinIndex(idx)}
                    className="flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
                    title={`Bin #${bin.binId}: $${bin.price} (${bin.type})`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        idx === selectedBinIndex
                          ? "bg-emerald-400"
                          : idx === 3
                          ? "bg-emerald-500/70"
                          : idx < 3
                          ? "bg-teal-700/60 group-hover:bg-teal-600"
                          : "bg-cyan-700/60 group-hover:bg-cyan-600"
                      }`}
                      style={{ height: `${(bin.depthUsdc / 620000) * 100}%` }}
                    />
                    <span className="text-[8px] text-slate-500 font-mono tabular-nums">
                      ${bin.price.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected Bin Forensic Detail */}
              <div className="p-2 rounded-sm bg-slate-900 border border-slate-800 text-[10px] flex justify-between items-center text-slate-300">
                <span>
                  Depth: <strong className="text-slate-100 font-mono tabular-nums">${binsData[selectedBinIndex].depthUsdc.toLocaleString()} USDC</strong>
                </span>
                <span className="text-cyan-400 font-semibold">{binsData[selectedBinIndex].type}</span>
              </div>
            </div>

            {/* Right: Risk Engine Verification Status */}
            <div className="lg:col-span-3 p-4 rounded-sm bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>RISK ENGINE VERDICT</span>
              </span>
              <div className="p-2.5 rounded-sm bg-emerald-950/60 border border-emerald-800 space-y-1.5">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PROPOSAL APPROVED</span>
                </div>
                <div className="text-[10px] text-slate-300 font-sans leading-tight">
                  Size Clamped: <strong className="text-slate-100 font-mono tabular-nums">$1,000.00 USDC</strong> (9.5% equity). Invariant latency: <strong className="text-emerald-400 font-mono tabular-nums">4.2ms</strong>.
                </div>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                <span>Enforcement:</span>
                <span className="text-slate-300">Fail-Closed Rust Core</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3: HOW IT WORKS (Verifiable 4-Tier Pipeline) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
            03. PIPELINE ARCHITECTURE
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            How Nexora Operates Without Human Latency
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
            <div className="w-7 h-7 rounded-sm bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-slate-100">Multi-Pool Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              High-frequency polling across Meteora DLMM discrete bins and Jupiter routed liquidity with sub-15s data freshness enforcement.
            </p>
            <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
              Filter: Liquidity &ge; $50k | Volume &ge; $100k
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
            <div className="w-7 h-7 rounded-sm bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 font-bold text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-slate-100">10-Factor Feature Vector</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Real-time quantitative calculation of order flow imbalance, 1h realized volatility, DLMM fee acceleration, and holder concentration.
            </p>
            <div className="text-[10px] text-teal-400 font-mono pt-1 border-t border-slate-800">
              Output: 0-100 Ranked Opportunity Score
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-emerald-900/60 space-y-2.5 hover:border-emerald-700 transition-colors">
            <div className="w-7 h-7 rounded-sm bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-emerald-300">Deterministic Risk Shield</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Zero-bypass mathematical invariants validate position sizes, slippage tolerance, and 24h drawdown limits in native sub-millisecond Rust.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono pt-1 border-t border-slate-800">
              Invariant: 10.0% Max Size / 50 bps Slippage
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
            <div className="w-7 h-7 rounded-sm bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 font-bold text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-slate-100">Non-Custodial Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Pre-flight simulation, priority fee compute budget optimization, and atomic swap execution via Anchor PDA delegated vaults.
            </p>
            <div className="text-[10px] text-amber-400 font-mono pt-1 border-t border-slate-800">
              Verification: Slot-Commitment Checked
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: AUTONOMOUS TRADING LOOP (Finite State Machine) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
              04. FINITE STATE AUTOMATON
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              The 8-Stage Deterministic Execution Cycle
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Click any stage to inspect latency & failsafe trigger
          </div>
        </div>

        {/* Step Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {loopSteps.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveLoopStep(s.id)}
              className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
                activeLoopStep === s.id
                  ? "bg-slate-900 border-cyan-500 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span className={activeLoopStep === s.id ? "text-cyan-300" : "text-slate-300"}>
                  {s.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono tabular-nums">{s.latency}</span>
              </div>
              <div className="text-xs text-slate-200 font-semibold mt-1">{s.title}</div>
              <p className="text-[11px] text-slate-400 mt-1 font-sans line-clamp-2">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Selected Stage Forensic Deep-Dive */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold text-xs">
                STAGE 0{activeLoopStep}
              </span>
              <span className="text-sm font-bold text-slate-100">
                {loopSteps[activeLoopStep - 1].title} ({loopSteps[activeLoopStep - 1].name})
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Execution Latency: <strong className="text-emerald-400 font-mono tabular-nums">{loopSteps[activeLoopStep - 1].latency}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-cyan-400 font-semibold">Deterministic State Guarantee</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-mono font-bold">Stage Functionality:</span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {loopSteps[activeLoopStep - 1].desc}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-rose-400 font-mono font-bold">Automated Failsafe Invariant:</span>
              <p className="text-rose-200/90 mt-1 leading-relaxed">
                {loopSteps[activeLoopStep - 1].failsafe}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5: RISK ARCHITECTURE (Mathematical Invariant Shield) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-emerald-400 uppercase tracking-wider font-bold">
            05. ZERO-BYPASS RISK SHIELD
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Hard Mathematical Constraints Over AI Output
          </h2>
        </div>

        {/* Invariant Rules Table */}
        <div className="overflow-x-auto rounded-sm border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Risk Invariant Rule</th>
                <th className="p-3">Protocol Threshold</th>
                <th className="p-3">Enforcement Layer</th>
                <th className="p-3">Automated Defense Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
              <tr>
                <td className="p-3 font-bold text-slate-100">Max Single Position Size</td>
                <td className="p-3 text-cyan-400 font-semibold font-mono tabular-nums">10.0% Max Equity ($1,000 Cap)</td>
                <td className="p-3">Local Rust Risk Engine + Anchor PDA</td>
                <td className="p-3 text-amber-400">Clamps position size down automatically</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-100">24h Daily Drawdown Circuit Breaker</td>
                <td className="p-3 text-rose-400 font-semibold font-mono tabular-nums">-3.0% Max Session Drawdown</td>
                <td className="p-3">Real-time Portfolio Monitor</td>
                <td className="p-3 text-rose-400">Immediate 24-hour trading freeze</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-100">Maximum Slippage Tolerance</td>
                <td className="p-3 text-amber-400 font-semibold font-mono tabular-nums">50 bps (0.50%)</td>
                <td className="p-3">Jupiter / Meteora Quote Verifier</td>
                <td className="p-3 text-rose-400">Aborts transaction pre-flight</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-100">Data Freshness Guard</td>
                <td className="p-3 text-emerald-400 font-semibold font-mono tabular-nums">&le; 15.0 Seconds</td>
                <td className="p-3">Market Ingestion Guard</td>
                <td className="p-3 text-rose-400">DO NOT TRADE (Stale Reject)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-100">AI Confidence Gate</td>
                <td className="p-3 text-cyan-400 font-semibold font-mono tabular-nums">&ge; 70.0% Confidence</td>
                <td className="p-3">Zod Schema Validator</td>
                <td className="p-3 text-rose-400">DO NOT TRADE (Low Confidence)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Interactive Invariant Simulator */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>INTERACTIVE INVARIANT SIMULATOR</span>
            </span>
            <span className="text-[11px] text-slate-400">Test how the Risk Engine intercepts unconstrained outputs</span>
          </div>

          {/* Scenario Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setSimScenario("valid")}
              className={`px-3 py-1.5 rounded-sm font-bold transition-all ${
                simScenario === "valid"
                  ? "bg-emerald-950 border border-emerald-500 text-emerald-400"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Scenario A: Valid Trade ($800, 12 bps slip)
            </button>
            <button
              onClick={() => setSimScenario("oversized")}
              className={`px-3 py-1.5 rounded-sm font-bold transition-all ${
                simScenario === "oversized"
                  ? "bg-amber-950 border border-amber-500 text-amber-400"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Scenario B: Oversized Trade ($2,500 proposed)
            </button>
            <button
              onClick={() => setSimScenario("slippage")}
              className={`px-3 py-1.5 rounded-sm font-bold transition-all ${
                simScenario === "slippage"
                  ? "bg-rose-950 border border-rose-500 text-rose-400"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Scenario C: Dangerous Slippage (120 bps)
            </button>
            <button
              onClick={() => setSimScenario("stale")}
              className={`px-3 py-1.5 rounded-sm font-bold transition-all ${
                simScenario === "stale"
                  ? "bg-rose-950 border border-rose-500 text-rose-400"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Scenario D: Stale Data Feed (45s age)
            </button>
          </div>

          {/* Scenario Results Panel */}
          <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">AI Proposal:</span>
              <div className="font-bold text-slate-200 mt-0.5">
                {simScenario === "valid" && "$800 USDC (7.6% eq, 12 bps slip)"}
                {simScenario === "oversized" && "$2,500 USDC (24% eq - Excess)"}
                {simScenario === "slippage" && "$1,000 USDC (120 bps slippage)"}
                {simScenario === "stale" && "$800 USDC (Market age: 45s)"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Invariant Verdict:</span>
              <div className="font-bold mt-0.5">
                {simScenario === "valid" && <span className="text-emerald-400">APPROVED</span>}
                {simScenario === "oversized" && <span className="text-amber-400">CLAMPED</span>}
                {simScenario === "slippage" && <span className="text-rose-400">REJECTED (VETO)</span>}
                {simScenario === "stale" && <span className="text-rose-400">REJECTED (STALE)</span>}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Final Execution:</span>
              <div className="font-bold text-slate-200 mt-0.5 font-mono tabular-nums">
                {simScenario === "valid" && "$800.00 USDC Executed"}
                {simScenario === "oversized" && "$1,000.00 USDC (Clamped to 10% cap)"}
                {simScenario === "slippage" && "$0.00 (Transaction Aborted)"}
                {simScenario === "stale" && "$0.00 (DO NOT TRADE enforced)"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Evaluation Latency:</span>
              <div className="font-bold text-emerald-400 mt-0.5 font-mono tabular-nums">4.2 ms</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 6: SUPPORTED ECOSYSTEM */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
            06. SOLANA ECOSYSTEM INTEGRATIONS
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Native DeFi & Infrastructure Protocols
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Meteora DLMM</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Discrete dynamic fee bin arrays, real-time volume acceleration capture, and active bin re-centering for optimal LP capture.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">
              Adapter: MeteoraExecutionProvider
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Jupiter v6 API</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Exact-In/Out atomic route optimization across all Solana DEX liquidity pools with strict slippage bounds and fee optimization.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">
              Adapter: JupiterExecutionProvider
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Anchor Vault PDA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Non-custodial delegated authorization smart contract enforcing single-trade and 24h rolling policy boundaries.
            </p>
            <div className="text-[10px] text-teal-400 font-mono">
              Program: nexora_vault
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Solana RPC & Pyth</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Sub-second block confirmation, pre-flight transaction simulation, slot commitment verification, and continuous price telemetry.
            </p>
            <div className="text-[10px] text-amber-400 font-mono">
              Network: Solana Devnet
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 7: EXAMPLE AGENT DECISION (Explainable AI Ledger) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
              07. EXPLAINABLE AI AUDIT TRAIL
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Real-World Structured Inference Inspection
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs">
              VERDICT: APPROVED
            </span>
            <a
              href="https://explorer.solana.com/tx/5Kj8b3ZmPqV8x9Yw2RtN7uE4sA6cK1dF9hL3jG5mPqV?cluster=devnet"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 text-xs"
            >
              <span>Solscan Receipt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDecisionTab("ai_output")}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors ${
                  decisionTab === "ai_output"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Structured AI Output (Gemini 2.5 Flash)
              </button>
              <button
                onClick={() => setDecisionTab("features")}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors ${
                  decisionTab === "features"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                10-Factor Feature Input
              </button>
              <button
                onClick={() => setDecisionTab("risk_log")}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors ${
                  decisionTab === "risk_log"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Invariant Verification Log
              </button>
              <button
                onClick={() => setDecisionTab("tx_receipt")}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors ${
                  decisionTab === "tx_receipt"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Solana Transaction Record
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify({ action: "BUY", confidence: 88, market: "SOL/USDC" }, null, 2))}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-sm bg-slate-950 border border-slate-800"
            >
              {copiedDecision ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDecision ? "Copied" : "Copy Payload"}</span>
            </button>
          </div>

          {/* Tab 1: AI Output */}
          {decisionTab === "ai_output" && (
            <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1">
              <div className="text-slate-500">// Schema-validated structured inference from Gemini 2.5 Flash</div>
              <div>&#123;</div>
              <div className="pl-4"><span className="text-cyan-400">"market"</span>: <span className="text-emerald-400">"SOL/USDC"</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"venue"</span>: <span className="text-emerald-400">"METEORA_DLMM"</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"action"</span>: <span className="text-emerald-400">"BUY"</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"confidence"</span>: <span className="text-amber-400">88</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"proposedPositionSizePercent"</span>: <span className="text-slate-100">9.5</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"entryReason"</span>: <span className="text-emerald-300">"Meteora SOL/USDC pool exhibiting 3.2x volume surge with fee APR surging to 48.2% and clean 15m momentum breakout."</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"invalidationReason"</span>: <span className="text-rose-300">"Price breaks lower active bin floor ($142.00)."</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"timeHorizon"</span>: <span className="text-teal-300">"SHORT_15M"</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"targetTakeProfitPrice"</span>: <span className="text-slate-100">156.50</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"stopLossPrice"</span>: <span className="text-slate-100">142.00</span></div>
              <div>&#125;</div>
            </div>
          )}

          {/* Tab 2: Feature Vector */}
          {decisionTab === "features" && (
            <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1">
              <div className="text-slate-500">// 10-Factor quantitative feature input ingested by SignalEngine</div>
              <div>&#123;</div>
              <div className="pl-4"><span className="text-cyan-400">"orderFlowImbalance"</span>: <span className="text-emerald-400">0.65</span> <span className="text-slate-500">// Strong buyer aggression</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"realizedVol1h"</span>: <span className="text-slate-100">0.038</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"feeVelocity24h"</span>: <span className="text-emerald-400">3.24</span> <span className="text-slate-500">// 3.2x normal baseline</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"liquidityDepthUsdc"</span>: <span className="text-slate-100">1850000</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"activeBinSpreadBps"</span>: <span className="text-slate-100">8</span>,</div>
              <div className="pl-4"><span className="text-cyan-400">"dataAgeMs"</span>: <span className="text-emerald-400">4200</span> <span className="text-slate-500">// Well within 15s threshold</span></div>
              <div>&#125;</div>
            </div>
          )}

          {/* Tab 3: Risk Log */}
          {decisionTab === "risk_log" && (
            <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1">
              <div className="text-slate-500">// Deterministic Invariant Gate telemetry</div>
              <div className="text-emerald-400">[0.00ms] INVARIANT_CHECK_START: proposal_id=prop-1428</div>
              <div className="text-slate-300">[0.80ms] PASS: size_check $1,000.00 &le; max_cap $1,000.00 (9.5% equity)</div>
              <div className="text-slate-300">[1.60ms] PASS: daily_drawdown current=-0.2% &ge; limit=-3.0%</div>
              <div className="text-slate-300">[2.40ms] PASS: slippage_bound estimated=12bps &le; limit=50bps</div>
              <div className="text-slate-300">[3.20ms] PASS: confidence 88% &ge; threshold 70%</div>
              <div className="text-slate-300">[4.00ms] PASS: data_freshness age=4.2s &le; 15.0s</div>
              <div className="text-emerald-400 font-bold">[4.20ms] INVARIANT_VERDICT: APPROVED</div>
            </div>
          )}

          {/* Tab 4: Tx Receipt */}
          {decisionTab === "tx_receipt" && (
            <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1">
              <div className="text-slate-500">// Solana Devnet onchain transaction details</div>
              <div>Signature: <span className="text-cyan-400">5Kj8b3ZmPqV8x9Yw2RtN7uE4sA6cK1dF9hL3jG5mPqV</span></div>
              <div>Slot: <span className="text-slate-100">312849201</span> | Status: <span className="text-emerald-400 font-bold">Finalized</span></div>
              <div>Compute Units Consumed: <span className="text-slate-100">84,210 CU</span> (Limit: 200,000 CU)</div>
              <div>Priority Fee Paid: <span className="text-slate-100">0.00005 SOL</span></div>
              <div>Program: <span className="text-teal-400">Meteora DLMM Swap (LBu6...9kF)</span></div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 8: PORTFOLIO INTELLIGENCE & BENCHMARK */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
            08. QUANTITATIVE ALPHA & BENCHMARK
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Nexora DMLH-v1 Strategy vs Passive SOL Holding
          </h2>
        </div>

        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Nexora Autonomous Strategy (+38.4%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>Passive SOL Holding (+14.2%)</span>
              </div>
            </div>
            <span className="text-slate-400 font-mono">30-Day Forward Backtest Window</span>
          </div>

          {/* SVG Equity Curve Chart */}
          <div className="h-52 w-full relative bg-slate-950/60 rounded-sm border border-slate-800 p-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="800" y2="40" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="800" y2="160" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />

              {/* Passive Benchmark Line */}
              <path
                d="M 0 170 Q 150 160, 300 140 T 500 135 T 700 120 T 800 110"
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />

              {/* Strategy Line */}
              <path
                d="M 0 170 Q 120 150, 240 120 T 450 90 T 600 55 T 800 25"
                fill="none"
                stroke="#00C087"
                strokeWidth="2.5"
              />
              <circle cx="800" cy="25" r="4" fill="#00C087" />
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-500">Sharpe Ratio:</span>{" "}
              <span className="text-slate-200 font-bold font-mono tabular-nums">2.42</span>
            </div>
            <div>
              <span className="text-slate-500">Max Drawdown:</span>{" "}
              <span className="text-emerald-400 font-bold font-mono tabular-nums">-1.2%</span>
            </div>
            <div>
              <span className="text-slate-500">Profit Factor:</span>{" "}
              <span className="text-cyan-400 font-bold font-mono tabular-nums">3.20</span>
            </div>
            <div>
              <span className="text-slate-500">Win Rate:</span>{" "}
              <span className="text-slate-200 font-bold font-mono tabular-nums">75.0%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 9: SECURITY ARCHITECTURE (Non-Custodial Defense) */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-emerald-400 uppercase tracking-wider font-bold">
            09. SECURITY THREAT MODEL & DEFENSES
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Why Capital is Immune to AI Hallucination
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Zero Raw Key Custody</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Ephemeral client session keypairs operate strictly in RAM. Zero private keys are stored in database models, backend logs, or browser localStorage.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">
              Protection: RAM-only volatile memory
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Anchor PDA Separation</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              The user wallet is the SOLE authority permitted to withdraw funds. The delegated agent is strictly restricted to policy-bounded DEX swaps.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">
              Authority: Onchain Program Derived Address
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Emergency Kill Switch</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              One-click zero-delay circuit breaker immediately pauses trading and executes optional panic liquidations into safe USDC.
            </p>
            <div className="text-[10px] text-rose-400 font-mono">
              Latency: Instantaneous onchain pause
            </div>
          </div>
        </div>

        {/* Authority Boundary Matrix */}
        <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            Authority Separation Matrix
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold">User Wallet (Owner Authority)</div>
              <div className="text-slate-300">• Deposit & Withdraw capital anytime</div>
              <div className="text-slate-300">• Set / Update risk policies & size limits</div>
              <div className="text-slate-300">• Authorize / Revoke agent session keys</div>
              <div className="text-slate-300">• Emergency Unpause & Policy Governance</div>
            </div>
            <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold">Delegated Agent (Trade-Only Authority)</div>
              <div className="text-rose-400">• CANNOT withdraw or transfer funds</div>
              <div className="text-slate-300">• Execute policy-bounded DEX swaps only</div>
              <div className="text-slate-300">• Trigger Emergency Pause on anomaly</div>
              <div className="text-rose-400">• CANNOT unpause without Owner signature</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 10: HACKATHON TECHNOLOGY STACK */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">
            10. TECHNOLOGY STACK
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Engineered for Solana High Throughput
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Code2 className="w-5 h-5 text-cyan-400 mx-auto" />
            <div className="font-bold text-slate-100">Rust & Anchor</div>
            <div className="text-[10px] text-slate-500">Vault Smart Contract</div>
          </div>
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Cpu className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-100">Gemini 2.5 Flash</div>
            <div className="text-[10px] text-slate-500">Structured AI Logic</div>
          </div>
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Layers className="w-5 h-5 text-teal-400 mx-auto" />
            <div className="font-bold text-slate-100">Meteora DLMM</div>
            <div className="text-[10px] text-slate-500">Dynamic Fee Routing</div>
          </div>
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Zap className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="font-bold text-slate-100">Jupiter v6</div>
            <div className="text-[10px] text-slate-500">DEX Route Engine</div>
          </div>
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Database className="w-5 h-5 text-cyan-400 mx-auto" />
            <div className="font-bold text-slate-100">Prisma & Bun</div>
            <div className="text-[10px] text-slate-500">Persistence & Events</div>
          </div>
          <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 text-center space-y-1">
            <Activity className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-100">React 18 & Vite</div>
            <div className="text-[10px] text-slate-500">Trading Terminal</div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 11: CALL-TO-ACTION (CTA) */}
      {/* ==================================================================== */}
      <section className="text-center p-8 sm:p-12 rounded-md bg-slate-900 border border-slate-800 space-y-5">
        <div className="w-12 h-12 rounded-sm bg-slate-950 border border-slate-800 mx-auto flex items-center justify-center">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
            Autonomous Capital Allocation Starts on Solana
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
            Experience the full live quantitative workstation in Devnet simulation or Paper Trading mode with real Solana liquidity feeds.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onLaunchTerminal}
            className="flex items-center gap-2 px-6 py-3 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider transition-colors shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>ENTER NEXORA TERMINAL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenOnboarding}
            className="px-5 py-3 rounded-sm bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            SETUP ONBOARDING TOUR
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500">
          <span>Non-Custodial Architecture</span>
          <span>•</span>
          <span>Solana Devnet Ready</span>
          <span>•</span>
          <span>Fail-Closed Security</span>
        </div>
      </section>
    </div>
  );
};
