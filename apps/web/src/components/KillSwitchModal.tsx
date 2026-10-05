import React, { useEffect } from "react";
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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kill-switch-title"
      aria-describedby="kill-switch-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono text-xs"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-rose-600 rounded-md p-5 space-y-4 shadow-2xl shadow-rose-950/80 animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rose-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="kill-switch-title" className="text-sm font-bold text-rose-300 tracking-wider">
                EMERGENCY OPERATOR OVERRIDE
              </h2>
              <div className="text-[10px] text-slate-400">
                Zero-Delay Circuit Breaker & Liquidation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close kill switch dialog"
            className="p-1 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text */}
        <p id="kill-switch-desc" className="text-slate-300 text-xs leading-relaxed">
          Triggering the Kill-Switch immediately revokes the autonomous agent's trade execution
          authority, freezes the state machine, and halts all scheduled cycles on the Solana network.
        </p>

        {/* Actions Grid */}
        <div className="space-y-2.5 pt-1">
          {/* Action 1: Pause Only */}
          <button
            onClick={() => onPanicKill(false)}
            className="w-full p-3 rounded-sm bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 font-bold flex items-center justify-between transition-colors group"
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
            <span className="text-[10px] text-amber-400 font-bold">
              EXECUTE ➔
            </span>
          </button>

          {/* Action 2: Panic Liquidate */}
          <button
            onClick={() => onPanicKill(true)}
            className="w-full p-3 rounded-sm bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-100 font-bold flex items-center justify-between transition-colors shadow-md shadow-rose-950/40 group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Flame className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-xs font-bold text-rose-200">
                  PANIC LIQUIDATE ALL & FREEZE
                </div>
                <div className="text-[10px] text-rose-300/80 font-normal">
                  Market-sell all active DLMM positions to USDC and freeze agent.
                </div>
              </div>
            </div>
            <span className="text-[10px] text-rose-300 font-bold">
              CRITICAL ➔
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px] text-slate-500">
          <span>Enforced locally in Rust & Anchor PDA</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded-sm bg-slate-800 transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
};
