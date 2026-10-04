import React, { useState } from "react";
import { AlertTriangle, Shield, X, Power, Flame } from "lucide-react";

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPanicKill: (liquidate: boolean) => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  onPanicKill,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-mono text-xs">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/80 rounded-xl p-6 space-y-5 shadow-2xl shadow-rose-950/50">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rose-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-400 tracking-wider">
                EMERGENCY OPERATOR OVERRIDE
              </h2>
              <div className="text-[11px] text-slate-400">
                Zero-Delay Circuit Breaker & Liquidation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text */}
        <p className="text-slate-300 text-xs leading-relaxed">
          Triggering the Kill-Switch immediately revokes the autonomous agent's trade execution
          authority, freezes the state machine, and halts all scheduled cycles on the Solana network.
        </p>

        {/* Actions Grid */}
        <div className="space-y-3 pt-1">
          {/* Action 1: Pause Only */}
          <button
            onClick={() => onPanicKill(false)}
            className="w-full p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Power className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-slate-100">PAUSE AGENT ONLY</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Halt new trades. Keep existing open positions intact.
                </div>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
              EXECUTE ➔
            </span>
          </button>

          {/* Action 2: Panic Liquidate */}
          <button
            onClick={() => onPanicKill(true)}
            className="w-full p-3.5 rounded-lg bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 border-2 border-rose-600 text-rose-100 font-bold flex items-center justify-between transition-all shadow-lg shadow-rose-950/60 group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
              <div>
                <div className="text-xs font-bold text-rose-200">
                  PANIC LIQUIDATE ALL & FREEZE
                </div>
                <div className="text-[10px] text-rose-400/80 font-normal">
                  Market-sell all active DLMM positions to USDC and freeze agent.
                </div>
              </div>
            </div>
            <span className="text-[10px] text-rose-300 font-bold group-hover:translate-x-0.5 transition-transform">
              CRITICAL ➔
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px] text-slate-500">
          <span>Enforced locally in Rust & Anchor PDA</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
};
