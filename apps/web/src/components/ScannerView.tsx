import React, { useState } from "react";
import {
  Compass,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Layers,
  Shield,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CandidateMarket } from "@nexora/shared";

interface ScannerViewProps {
  markets: CandidateMarket[];
  onSelectMarket: (market: CandidateMarket) => void;
  onInspectMarket: (market: CandidateMarket) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  markets,
  onSelectMarket,
  onInspectMarket,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState(60);
  const [venueFilter, setVenueFilter] = useState<"ALL" | "METEORA_DLMM" | "JUPITER">("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const filtered = markets.filter((m) => {
    if (m.opportunityScore < minScore) return false;
    if (venueFilter !== "ALL" && m.venue !== venueFilter) return false;
    if (verifiedOnly && !m.baseToken.isVerified) return false;
    if (searchTerm) {
      const match =
        m.baseToken.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.quoteToken.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.address.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono max-w-7xl mx-auto">
      {/* 1. Header & Filter Bar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>ONCHAIN MARKET SCANNER</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Live Solana DLMM & DEX Liquidity Screener
            </h2>
          </div>

          <div className="text-xs text-slate-400">
            Matching Pools: <span className="text-emerald-400 font-bold">{filtered.length}</span> / {markets.length}
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search pair or mint address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Venue Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-1">
            {(["ALL", "METEORA_DLMM", "JUPITER"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVenueFilter(v)}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                  venueFilter === v
                    ? "bg-slate-800 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {v === "ALL" ? "ALL DEXs" : v === "METEORA_DLMM" ? "Meteora" : "Jupiter"}
              </button>
            ))}
          </div>

          {/* Min Opportunity Score Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min Score:</span>
              <span className="text-cyan-400 font-bold">{minScore} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded">
            <input
              type="checkbox"
              id="verifiedOnlyToggle"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="verifiedOnlyToggle" className="text-slate-300 text-[11px] cursor-pointer">
              Verified Tokens & Renounced Mint Only
            </label>
          </div>
        </div>
      </div>

      {/* 2. High-Density Market Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">Asset Pair</th>
              <th className="p-3">DEX Venue</th>
              <th className="p-3">Price (USDC)</th>
              <th className="p-3">24h Change</th>
              <th className="p-3">24h Volume</th>
              <th className="p-3">TVL Depth</th>
              <th className="p-3">Fee APR</th>
              <th className="p-3">OFI Imbalance</th>
              <th className="p-3">Score (0-100)</th>
              <th className="p-3">Recommendation</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500">
                  No pools meet the selected filtering criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const score = m.opportunityScore;
                const rec =
                  score >= 80 ? "BUY" : score >= 70 ? "WATCH" : score >= 50 ? "HOLD" : "AVOID";
                const recColor =
                  rec === "BUY"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800/80"
                    : rec === "WATCH"
                    ? "bg-amber-950 text-amber-400 border-amber-800/80"
                    : rec === "HOLD"
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-rose-950 text-rose-400 border-rose-800/80";

                return (
                  <tr
                    key={m.address}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectMarket(m)}
                  >
                    {/* Pair */}
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{m.baseToken.symbol}/{m.quoteToken.symbol}</span>
                      {m.securityStatus?.isMintRenounced && (
                        <span title="Mint Renounced">
                          <Shield className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </td>

                    {/* Venue */}
                    <td className="p-3 text-slate-400 text-[11px]">
                      {m.venue.replace("_", " ")}
                    </td>

                    {/* Price */}
                    <td className="p-3 font-semibold text-slate-100 tabular-nums">
                      ${m.metrics.priceUsdc < 0.01 ? m.metrics.priceUsdc.toFixed(6) : m.metrics.priceUsdc.toFixed(2)}
                    </td>

                    {/* 24h Change */}
                    <td
                      className={`p-3 tabular-nums font-semibold ${
                        m.metrics.priceChange24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {m.metrics.priceChange24hPct >= 0 ? "+" : ""}
                      {m.metrics.priceChange24hPct.toFixed(2)}%
                    </td>

                    {/* Volume */}
                    <td className="p-3 text-slate-300 tabular-nums">
                      ${(m.metrics.volume24hUsdc / 1000).toFixed(0)}k
                    </td>

                    {/* TVL */}
                    <td className="p-3 text-slate-300 tabular-nums">
                      ${(m.metrics.liquidityDepthUsdc / 1000).toFixed(0)}k
                    </td>

                    {/* Fee APR */}
                    <td className="p-3 text-emerald-400 tabular-nums font-semibold">
                      {m.metrics.feeAprPct.toFixed(1)}%
                    </td>

                    {/* OFI */}
                    <td className="p-3 text-cyan-400 tabular-nums">
                      +{m.metrics.orderFlowImbalance.toFixed(2)}
                    </td>

                    {/* Score Bar */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums text-slate-100">
                          {score.toFixed(1)}
                        </span>
                        <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              score >= 80 ? "bg-emerald-400" : score >= 70 ? "bg-cyan-400" : "bg-slate-600"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Recommendation */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${recColor}`}>
                        {rec}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectMarket(m);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
