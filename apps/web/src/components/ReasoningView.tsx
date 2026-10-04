import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Zap,
  Filter,
  Search,
} from "lucide-react";
import { DecisionLedgerRecord } from "@nexora/shared";

interface ReasoningViewProps {
  decisions: DecisionLedgerRecord[];
}

export const ReasoningView: React.FC<ReasoningViewProps> = ({ decisions }) => {
  const [filterVerdict, setFilterVerdict] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");

  const filtered = decisions.filter((d) => {
    if (filterVerdict === "APPROVED") return d.riskVerdict === "APPROVED";
    if (filterVerdict === "REJECTED") return d.riskVerdict === "REJECTED";
    return true;
  });

  return (
    <div className="space-y-4 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>EXPLAINABLE AI REASONING AUDIT TRAIL</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Structured Decision Hypotheses & Invariant Verifications
          </h2>
        </div>

        {/* Filter */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 text-[11px]">
          {(["ALL", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterVerdict(f)}
              className={`px-3 py-1 rounded transition-colors ${
                filterVerdict === f
                  ? "bg-slate-800 text-cyan-400 font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Decision Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-lg">
            No decision records match the selected filter.
          </div>
        ) : (
          filtered.map((d) => {
            const isApproved = d.riskVerdict === "APPROVED";
            return (
              <div
                key={d.id}
                className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3"
              >
                {/* Top Row: ID, Pair, Time, Verdict */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="text-slate-400">{d.id}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-100">{d.pairSymbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-normal">
                      Score: {d.score.toFixed(1)} / 100
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px] tabular-nums">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                        isApproved
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : "bg-rose-950 text-rose-400 border-rose-800"
                      }`}
                    >
                      {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{d.riskVerdict}</span>
                    </span>
                  </div>
                </div>

                {/* Main Rationale */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">AI Reasoning & Hypothesis:</div>
                  <p className="text-slate-200 text-xs leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    {d.decision.entryReason}
                  </p>
                </div>

                {/* Signals & Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500">Confidence & Proposed Size</span>
                    <div className="text-slate-200 font-semibold">
                      Confidence: <span className="text-cyan-400 font-bold">{d.decision.confidence}%</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Proposed Size: {d.decision.positionSizePercent}% (Clamped: ${d.clampedPositionSizeUsdc?.toFixed(0) || "N/A"})
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500">Invalidation Rule</span>
                    <div className="text-amber-400 font-semibold">
                      {d.decision.invalidationReason || "Below key support"}
                    </div>
                    <div className="text-slate-500 text-[10px]">Time Horizon: {d.decision.timeHorizon || "15m"}</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500">Risk Assessment / Rejection</span>
                    <div className={isApproved ? "text-emerald-400 font-bold" : "text-rose-400 font-bold truncate"}>
                      {isApproved ? "Passed All Invariants" : d.rejectionReason}
                    </div>
                    {d.txSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${d.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                      >
                        <span>View Onchain Receipt</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
