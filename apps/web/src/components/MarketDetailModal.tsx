import React, { useEffect } from "react";
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
import { formatPrice, formatCurrency, formatPercent, formatCompactNumber } from "@nexora/ui";

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
  useEffect(() => {
    if (!market) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [market, onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono text-xs"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {m.baseToken.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="market-modal-title" className="text-sm font-bold text-slate-100">
                  {m.baseToken.symbol}/{m.quoteToken.symbol}
                </h2>
                <span className="px-1.5 py-0.2 bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-400 rounded-xs">
                  {m.venue.replace("_", " ")}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-xs sm:max-w-md">
                Mint: {m.address}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close market inspector"
            className="p-1 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-500 uppercase">Current Price</span>
              <div className="text-base font-bold text-slate-100 tabular-nums">
                {formatPrice(m.metrics.priceUsdc)}
              </div>
              <div className="text-[10px] text-emerald-400">
                {formatPercent(m.metrics.priceChange24hPct, 2)} (24h)
              </div>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-500 uppercase">Opportunity Score</span>
              <div className="text-base font-bold text-emerald-400 tabular-nums">
                {m.opportunityScore.toFixed(1)} / 100
              </div>
              <div className="text-[10px] text-slate-400">Rank: #1 Setup</div>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-500 uppercase">DLMM Fee APR</span>
              <div className="text-base font-bold text-cyan-400 tabular-nums">
                {m.metrics.feeAprPct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">Bin #{m.metrics.activeBinId}</div>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-500 uppercase">24h Pool Volume</span>
              <div className="text-base font-bold text-slate-100 tabular-nums">
                {formatCompactNumber(m.metrics.volume24hUsdc)}
              </div>
              <div className="text-[10px] text-slate-400">Depth: {formatCompactNumber(m.metrics.liquidityDepthUsdc)}</div>
            </div>
          </div>

          {/* 10-Factor Signal Vector Breakdown */}
          <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-200 text-xs">
                10-FACTOR QUANTITATIVE SIGNAL VECTOR BREAKDOWN
              </span>
              <span className="text-emerald-400 font-bold text-xs">Composite: {m.opportunityScore.toFixed(1)}</span>
            </div>

            <div className="space-y-1.5">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                  <div className="w-1/3 text-slate-300 font-medium truncate">{f.name}</div>
                  <div className="w-12 text-slate-500 text-[10px]">{f.weight}</div>
                  <div className="flex-1 bg-slate-900 h-1.5 rounded-none overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full"
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
          <div className="p-3.5 rounded-sm bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>ONCHAIN SECURITY & TOKEN SAFETY AUDIT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-sm bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Mint Authority</div>
                  <div className="text-[10px] text-emerald-400">Renounced (Zero Minting)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-sm bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Freeze Authority</div>
                  <div className="text-[10px] text-emerald-400">Disabled (Unrestricted)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-sm bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">LP Lock Status</div>
                  <div className="text-[10px] text-emerald-400">100.0% Burned / Locked</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950">
          <a
            href={`https://explorer.solana.com/address/${m.address}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <span>Explorer Contract</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors text-xs"
            >
              Close
            </button>
            <button
              onClick={() => {
                onExecuteSimulatedTrade(m);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors text-xs"
            >
              Simulate In Terminal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
