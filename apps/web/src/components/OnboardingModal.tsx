import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Lock,
  Layers,
  Terminal,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTerminal: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onLaunchTerminal,
}) => {
  const [step, setStep] = useState(1);

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
      aria-labelledby="onboarding-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono text-xs"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-xs bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
              0{step}
            </span>
            <h2 id="onboarding-modal-title" className="font-bold text-slate-100 text-xs sm:text-sm">
              {step === 1 && "1. Welcome to NEXORA Quantitative Terminal"}
              {step === 2 && "2. Zero-Bypass Risk & Invariant Boundaries"}
              {step === 3 && "3. Solana Devnet & Session Activation"}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close onboarding tour"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Concept */}
        {step === 1 && (
          <div className="space-y-3 text-slate-300 leading-relaxed font-sans text-xs">
            <p>
              <strong className="text-cyan-400 font-mono">NEXORA</strong> is an institutional-grade autonomous
              capital allocator engineered for Solana high-throughput liquidity venues
              (Meteora DLMM & Jupiter v6).
            </p>

            <div className="p-3 rounded-sm bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>The Core Architecture Doctrine</span>
              </div>
              <div className="text-slate-400 leading-normal space-y-0.5">
                <div>1. <strong className="text-slate-200">The AI Decides:</strong> Continuous pattern & fee surge discovery.</div>
                <div>2. <strong className="text-slate-200">The Risk Engine Controls:</strong> Local deterministic Rust invariants.</div>
                <div>3. <strong className="text-slate-200">The Policy Layer Enforces:</strong> Non-custodial Anchor smart contracts.</div>
                <div>4. <strong className="text-slate-200">The Blockchain Executes:</strong> Atomic swaps on Solana Devnet.</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Risk Envelope */}
        {step === 2 && (
          <div className="space-y-3 text-slate-300 leading-relaxed font-sans text-xs">
            <p>
              Unlike experimental prompt bots, NEXORA enforces hard mathematical constraints that
              cannot be overridden or bypassed by the AI model:
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-200 text-[10px] uppercase">Max Trade Size</div>
                <div className="text-cyan-400 font-bold tabular-nums">10.0% Max Equity</div>
                <div className="text-[10px] text-slate-500">Auto-clamped by risk engine</div>
              </div>

              <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-200 text-[10px] uppercase">Daily Circuit Breaker</div>
                <div className="text-rose-400 font-bold tabular-nums">-3.0% Max Loss</div>
                <div className="text-[10px] text-slate-500">Freezes trading for 24 hours</div>
              </div>

              <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-200 text-[10px] uppercase">Data Freshness Guard</div>
                <div className="text-emerald-400 font-bold tabular-nums">&le; 15.0s Limit</div>
                <div className="text-[10px] text-slate-500">Rejects stale market quotes</div>
              </div>

              <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-200 text-[10px] uppercase">AI Confidence Gate</div>
                <div className="text-emerald-400 font-bold tabular-nums">&ge; 70.0% Confidence</div>
                <div className="text-[10px] text-slate-500">Strict Zod schema validation</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Activation */}
        {step === 3 && (
          <div className="space-y-3 text-slate-300 leading-relaxed font-sans text-xs">
            <p>
              Your workstation is initialized in safe <strong>Solana Devnet</strong> simulation mode:
            </p>

            <div className="p-3 rounded-sm bg-slate-950 border border-emerald-900/60 space-y-1.5 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Devnet Vault Initialized</span>
              </div>
              <div className="text-slate-400">
                Starting portfolio: <strong className="text-slate-100">$10,428.50 USDC</strong> virtual balance.<br />
                Real-time Meteora DLMM pool feed active.
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-800 font-mono">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-sm bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-3.5 py-1.5 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onLaunchTerminal();
              }}
              className="px-4 py-1.5 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>LAUNCH TERMINAL NOW</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
