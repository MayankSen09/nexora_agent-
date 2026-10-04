import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Clock,
} from "lucide-react";
import { TransactionRecord } from "@nexora/shared";

interface TransactionsViewProps {
  transactions: TransactionRecord[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions }) => {
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  return (
    <div className="space-y-4 font-mono max-w-7xl mx-auto text-xs">
      {/* 1. Header */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>ONCHAIN TRANSACTION FORENSICS</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Solana Devnet Execution Ledger & Verification
          </h2>
        </div>

        <div className="text-slate-400 text-xs">
          Total Broadcasts: <span className="text-emerald-400 font-bold">{transactions.length}</span>
        </div>
      </div>

      {/* 2. Transactions Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">Signature</th>
              <th className="p-3">Status</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Action</th>
              <th className="p-3">Market Pool</th>
              <th className="p-3">Amount (USDC)</th>
              <th className="p-3">Price</th>
              <th className="p-3">Slippage</th>
              <th className="p-3">Time</th>
              <th className="p-3 text-right">Solscan Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No onchain transactions recorded yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.signature}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="p-3 font-mono font-bold text-cyan-400 truncate max-w-[140px]">
                    {tx.signature.slice(0, 12)}...
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400 font-bold flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">{tx.provider}</td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        tx.action === "BUY"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {tx.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 text-[11px] truncate max-w-[160px]">{tx.market}</td>
                  <td className="p-3 text-slate-200 tabular-nums font-semibold">${tx.amount.toFixed(2)}</td>
                  <td className="p-3 text-slate-200 tabular-nums">
                    ${tx.price < 0.01 ? tx.price.toFixed(6) : tx.price.toFixed(2)}
                  </td>
                  <td className="p-3 text-amber-400 tabular-nums">{tx.slippage}%</td>
                  <td className="p-3 text-slate-500 tabular-nums">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal if row is clicked */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100 text-sm">
                Transaction Forensic Breakdown
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Signature:</span>
                <span className="text-cyan-400 font-bold select-all break-all ml-2">{selectedTx.signature}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">DEX Execution Route:</span>
                <span className="text-emerald-400 font-bold">{selectedTx.provider} ({selectedTx.action})</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Amount & Price:</span>
                <span className="text-slate-200 font-bold tabular-nums">${selectedTx.amount.toFixed(2)} @ ${selectedTx.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Slippage Tolerance:</span>
                <span className="text-amber-400 font-bold tabular-nums">{selectedTx.slippage}%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://explorer.solana.com/tx/${selectedTx.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                <span>View on Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
