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
  RotateCcw,
} from "lucide-react";
import { CandidateMarket } from "@nexora/shared";
import { formatCurrency, formatPrice, formatPercent, formatCompactNumber } from "@nexora/ui";

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

  const resetFilters = () => {
    setSearchTerm("");
    setMinScore(0);
    setVenueFilter("ALL");
    setVerifiedOnly(false);
  };

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
    <div className="space-y-4 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header & Filter Bar */}
      <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
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
            Matching Pools: <span className="text-emerald-400 font-bold font-mono tabular-nums">{filtered.length}</span> / {markets.length}
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search pair or mint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Venue Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5">
            {(["ALL", "METEORA_DLMM", "JUPITER"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVenueFilter(v)}
                className={`flex-1 py-1 rounded-sm text-[10px] font-bold transition-all ${
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
              <span className="text-cyan-400 font-bold font-mono tabular-nums">{minScore} / 100</span>
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
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-sm">
            <input
              type="checkbox"
              id="verifiedOnlyToggle"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded-sm bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="verifiedOnlyToggle" className="text-slate-300 text-[11px] cursor-pointer">
              Verified Tokens & Renounced Only
            </label>
          </div>
        </div>
      </div>

      {/* 2. High-Density Market Table */}
      <div className="rounded-sm bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
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
          <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-sm bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-slate-200 font-semibold text-sm">No Matching Liquidity Pools</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      No pools match the current filter criteria (Min Score: {minScore}, Venue: {venueFilter}).
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 px-3 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const score = m.opportunityScore;
                const rec =
                  score >= 80 ? "BUY" : score >= 70 ? "WATCH" : score >= 50 ? "HOLD" : "AVOID";
                const recColor =
                  rec === "BUY"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : rec === "WATCH"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : rec === "HOLD"
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-rose-950 text-rose-400 border-rose-800";

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
                      {formatPrice(m.metrics.priceUsdc)}
                    </td>

                    {/* 24h Change */}
                    <td
                      className={`p-3 tabular-nums font-semibold ${
                        m.metrics.priceChange24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {m.metrics.priceChange24hPct >= 0 ? "+" : ""}
                      {formatPercent(m.metrics.priceChange24hPct)}
                    </td>

                    {/* Volume */}
                    <td className="p-3 text-slate-300 tabular-nums">
                      {formatCompactNumber(m.metrics.volume24hUsdc)}
                    </td>

                    {/* TVL */}
                    <td className="p-3 text-slate-300 tabular-nums">
                      {formatCompactNumber(m.metrics.liquidityDepthUsdc)}
                    </td>

                    {/* Fee APR */}
                    <td className="p-3 text-emerald-400 tabular-nums font-semibold">
                      {formatPercent(m.metrics.feeAprPct)}
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
                        <div className="w-14 bg-slate-950 h-1.5 rounded-sm overflow-hidden">
                          <div
                            className={`h-full rounded-sm ${
                              score >= 80 ? "bg-emerald-400" : score >= 70 ? "bg-cyan-400" : "bg-slate-600"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Recommendation */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold ${recColor}`}>
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
                        className="px-2.5 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-semibold transition-colors"
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
