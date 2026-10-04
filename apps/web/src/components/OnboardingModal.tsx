import React, { useState } from "react";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-mono text-xs">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center text-xs">
              0{step}
            </span>
            <span className="font-bold text-slate-100 text-sm">
              {step === 1 && "1. Welcome to NEXORA Autonomous Terminal"}
              {step === 2 && "2. Zero-Bypass Risk & Invariant Boundaries"}
              {step === 3 && "3. Solana Devnet & Session Key Activation"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Concept */}
        {step === 1 && (
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              <strong className="text-cyan-400">NEXORA</strong> is an institutional-grade autonomous
              capital allocator built specifically for high-speed Solana DeFi liquidity venues
              (Meteora DLMM & Jupiter v6).
            </p>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>The Core Architecture Doctrine</span>
              </div>
              <div className="text-[11px] text-slate-400">
                1. <strong>AI Decides:</strong> Continuous pattern & fee surge discovery.<br />
                2. <strong>Risk Shield Controls:</strong> Local deterministic Rust invariants.<br />
                3. <strong>Vault Enforces:</strong> Non-custodial Anchor smart contracts.<br />
                4. <strong>Blockchain Executes:</strong> Atomic swaps on Solana Devnet.
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Risk Envelope */}
        {step === 2 && (
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Unlike reckless autonomous bots, NEXORA enforces hard mathematical constraints that
              cannot be overridden by the AI model:
            </p>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Max Trade Size</div>
                <div className="text-cyan-400 font-bold tabular-nums">10.0% Max Equity</div>
                <div className="text-[10px] text-slate-500">Auto-clamped by risk engine</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Daily Circuit Breaker</div>
                <div className="text-rose-400 font-bold tabular-nums">-3.0% Max 24h Loss</div>
                <div className="text-[10px] text-slate-500">Freezes trading for 24 hours</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Data Freshness Guard</div>
                <div className="text-emerald-400 font-bold">&le; 15.0s Limit</div>
                <div className="text-[10px] text-slate-500">Rejects stale market quotes</div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">AI Confidence Gate</div>
                <div className="text-emerald-400 font-bold">&ge; 70.0% Confidence</div>
                <div className="text-[10px] text-slate-500">Strict Zod schema validation</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Activation */}
        {step === 3 && (
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              You are ready to explore the terminal in safe <strong>Solana Devnet</strong> simulation mode:
            </p>

            <div className="p-4 rounded bg-slate-950 border border-emerald-900/60 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Devnet Vault Initialized</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Starting portfolio: <strong>$10,428.50 USDC</strong> virtual balance.<br />
                Real-time Meteora DLMM pool feed active.
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1"
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
              className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
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
              className="px-5 py-2 rounded bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>LAUNCH TERMINAL NOW</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
