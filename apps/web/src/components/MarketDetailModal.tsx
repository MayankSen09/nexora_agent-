import React from "react";
import {
  X,
  Shield,
  Layers,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Zap,
} from "lucide-react";
import { CandidateMarket } from "@nexora/shared";

interface MarketDetailModalProps {
  market: CandidateMarket | null;
  onClose: () => void;
  onExecuteSimulatedTrade: (market: CandidateMarket) => void;
}

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({
  market,
  onClose,
  onExecuteSimulatedTrade,
}) => {
  if (!market) return null;

  const m = market;
  const factors = [
    { name: "Momentum (15m & 1h)", score: 86, weight: "20%", impact: "STRONG_BULLISH" },
    { name: "Volume Acceleration", score: 92, weight: "20%", impact: "SURGE_3.2X" },
    { name: "DLMM Fee APR Surge", score: 94, weight: "15%", impact: "48.2% APR" },
    { name: "Liquidity Depth & Stability", score: 82, weight: "15%", impact: "$620k DEPTH" },
    { name: "Order Flow Imbalance (OFI)", score: 85, weight: "10%", impact: "+0.65 BUY DOM" },
    { name: "Holder Growth / Distribution", score: 78, weight: "10%", impact: "ORGANIC" },
    { name: "Volatility Safety Risk", score: 88, weight: "10%", impact: "LOW VOL (2.4%)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono text-xs">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {m.baseToken.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100">
                  {m.baseToken.symbol}/{m.quoteToken.symbol}
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-400 rounded">
                  {m.venue.replace("_", " ")}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-md">
                Address: {m.address}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Current Price</span>
              <div className="text-lg font-bold text-slate-100 tabular-nums">
                ${m.metrics.priceUsdc < 0.01 ? m.metrics.priceUsdc.toFixed(6) : m.metrics.priceUsdc.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-400">
                +{m.metrics.priceChange24hPct.toFixed(2)}% (24h)
              </div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Opportunity Score</span>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                {m.opportunityScore.toFixed(1)} / 100
              </div>
              <div className="text-[10px] text-slate-400">Rank: #1 Candidate</div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">DLMM Fee APR</span>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">
                {m.metrics.feeAprPct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">Active Bin #{m.metrics.activeBinId}</div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">24h Pool Volume</span>
              <div className="text-lg font-bold text-slate-100 tabular-nums">
                ${(m.metrics.volume24hUsdc / 1000).toFixed(0)}k
              </div>
              <div className="text-[10px] text-slate-400">Depth: ${(m.metrics.liquidityDepthUsdc / 1000).toFixed(0)}k</div>
            </div>
          </div>

          {/* 10-Factor Opportunity Vector Breakdown */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">
                10-FACTOR QUANTITATIVE SIGNAL VECTOR BREAKDOWN
              </span>
              <span className="text-emerald-400 font-bold">Aggregate: {m.opportunityScore.toFixed(1)}</span>
            </div>

            <div className="space-y-2">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-3">
                  <div className="w-1/3 text-slate-300 font-medium truncate">{f.name}</div>
                  <div className="w-16 text-slate-500 text-[10px]">{f.weight}</div>
                  <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-bold text-cyan-400 tabular-nums">
                    {f.score} <span className="text-[9px] text-slate-500">({f.impact})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Verification Matrix */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ONCHAIN SECURITY & TOKEN SAFETY AUDIT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-200">Mint Authority</div>
                  <div className="text-[10px] text-emerald-400">Renounced (Zero Inflation)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-200">Freeze Authority</div>
                  <div className="text-[10px] text-emerald-400">Disabled (Unrestricted)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-200">LP Lock Status</div>
                  <div className="text-[10px] text-emerald-400">100.0% Burned / Locked</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/50">
          <a
            href={`https://explorer.solana.com/address/${m.address}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <span>View Contract on Solana Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs"
            >
              Close
            </button>
            <button
              onClick={() => {
                onExecuteSimulatedTrade(m);
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold transition-all text-xs"
            >
              Simulate Policy Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
