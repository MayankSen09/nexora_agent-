import React, { useState } from "react";
import {
  Layers,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Trade } from "@nexora/shared";
import { formatCurrency, formatPrice, formatPercent, formatTimestamp } from "@nexora/ui";

interface TradeHistoryViewProps {
  trades: Trade[];
}

export const TradeHistoryView: React.FC<TradeHistoryViewProps> = ({ trades }) => {
  const [filterOutcome, setFilterOutcome] = useState<"ALL" | "WINS" | "LOSSES">("ALL");

  const filtered = trades.filter((t) => {
    const pnl = t.realizedPnlUsdc ?? 0;
    if (filterOutcome === "WINS") return pnl > 0;
    if (filterOutcome === "LOSSES") return pnl <= 0;
    return true;
  });

  const exportCSV = () => {
    const headers = "Trade ID,Pair,Side,Price USDC,Size Units,Size USDC,Realized PnL USDC,Realized PnL Pct,Exit Reason,Executed At\n";
    const rows = filtered
      .map(
        (t) =>
          `${t.id},${t.pairSymbol},${t.side},${t.priceUsdc},${t.sizeUnits},${t.sizeUsdc},${t.realizedPnlUsdc ?? 0},${t.realizedPnlPct ?? 0},${t.exitReason || "N/A"},${t.executedAt}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora-trades-${Date.now()}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora-trades-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header & Export Buttons */}
      <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>TRADE EXECUTION JOURNAL</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Historical Closed Trades & Execution Forensics
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Outcome Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5 text-[11px]">
            {(["ALL", "WINS", "LOSSES"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterOutcome(f)}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  filterOutcome === f
                    ? "bg-slate-800 text-cyan-400 font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportJSON}
            className="flex items-center gap-1 px-3 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Trades Table */}
      <div className="rounded-sm bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">Trade ID</th>
              <th className="p-3">Asset Pair</th>
              <th className="p-3">Side</th>
              <th className="p-3">Execution Price</th>
              <th className="p-3">Size (USDC)</th>
              <th className="p-3">Realized PnL</th>
              <th className="p-3">Fee (USDC)</th>
              <th className="p-3">Exit Reason</th>
              <th className="p-3">Executed At</th>
              <th className="p-3 text-right">Solana Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-sm bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-slate-200 font-semibold text-sm">No Trade Records Found</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      No closed trades match the current filter ({filterOutcome}).
                    </p>
                    {filterOutcome !== "ALL" && (
                      <button
                        onClick={() => setFilterOutcome("ALL")}
                        className="mt-2 px-3 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Show All Trades</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const pnl = t.realizedPnlUsdc ?? 0;
                const pnlPct = t.realizedPnlPct ?? 0;
                const isWin = pnl > 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">{t.id}</td>
                    <td className="p-3 font-bold text-slate-100">{t.pairSymbol}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${
                        t.side === "BUY"
                          ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                          : "bg-rose-950 border-rose-800 text-rose-400"
                      }`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums font-semibold text-slate-100">
                      {formatPrice(t.priceUsdc)}
                    </td>
                    <td className="p-3 tabular-nums text-slate-300 font-semibold">
                      {formatCurrency(t.sizeUsdc)}
                    </td>
                    <td
                      className={`p-3 tabular-nums font-bold flex items-center gap-1 ${
                        isWin ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isWin ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>
                        {isWin ? "+" : ""}{formatCurrency(pnl)} ({isWin ? "+" : ""}{formatPercent(pnlPct)})
                      </span>
                    </td>
                    <td className="p-3 tabular-nums text-slate-400">
                      {formatCurrency(t.feeUsdc || 0)}
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                        {t.exitReason || "MARKET_SWAP"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] font-mono tabular-nums">
                      {formatTimestamp(t.executedAt)}
                    </td>
                    <td className="p-3 text-right">
                      {t.txSignature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${t.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-600">Simulated</span>
                      )}
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
