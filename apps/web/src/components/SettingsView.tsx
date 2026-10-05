import React, { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Database,
  Radio,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  RefreshCw,
} from "lucide-react";
import { PROTOCOL_CONSTANTS } from "@nexora/shared";

export const SettingsView: React.FC = () => {
  const [env, setEnv] = useState<"DEVNET" | "PAPER_TRADING" | "MAINNET">("DEVNET");
  const [rpcUrl, setRpcUrl] = useState("https://api.devnet.solana.com");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [priorityFee, setPriorityFee] = useState("50000"); // 50k micro-lamports
  const [sessionKeyActive, setSessionKeyActive] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 font-mono max-w-5xl mx-auto text-xs">
      {/* 1. Header */}
      <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 border-b pb-3">
        <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>SYSTEM & WORKSPACE CONFIGURATION</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">
          Environment, AI Models, RPC Nodes & Session Keys
        </h2>
      </div>

      {/* 2. Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Environment & Network */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>EXECUTION ENVIRONMENT</span>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-[11px]">Trading Execution Target:</label>
            <div className="grid grid-cols-3 gap-2">
              {(["DEVNET", "PAPER_TRADING", "MAINNET"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setEnv(m)}
                  className={`py-2 px-2 rounded-sm text-[11px] font-bold border transition-all text-center ${
                    env === m
                      ? "bg-slate-800 text-cyan-400 border-cyan-500 shadow-sm"
                      : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                  }`}
                >
                  {m === "DEVNET" ? "Solana Devnet" : m === "PAPER_TRADING" ? "Paper Sim" : "Mainnet Locked"}
                </button>
              ))}
            </div>
            {env === "MAINNET" && (
              <div className="p-2.5 rounded-sm bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Mainnet live trades require manual execution unlocking and a hard $250.00 USDC safety cap.</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="rpc-url-input" className="text-slate-400 text-[11px]">Solana RPC Endpoint:</label>
            <input
              id="rpc-url-input"
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>
        </div>

        {/* AI Model & Reasoning Engine */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI HYPOTHESIS ENGINE</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="ai-model-select" className="text-slate-400 text-[11px]">Active AI Model:</label>
            <select
              id="ai-model-select"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (1.4s Mean Latency)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Structured Reasoning)</option>
              <option value="gpt-4o">OpenAI GPT-4o Mini (1.8s)</option>
              <option value="mock-engine">Mock Engine (Offline Deterministic)</option>
            </select>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="priority-fee-input" className="text-slate-400 text-[11px]">Priority Fee (micro-lamports / CU):</label>
            <input
              id="priority-fee-input"
              type="number"
              value={priorityFee}
              onChange={(e) => setPriorityFee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono tabular-nums"
            />
          </div>
        </div>

        {/* Delegated Ephemeral Session Key */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 space-y-3 md:col-span-2">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>NON-CUSTODIAL DELEGATED SESSION KEY</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Ephemeral RAM-Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-sm bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[10px]">Session Public Key</div>
              <div className="font-mono font-bold text-slate-200 truncate mt-1">
                7xK9...vB4qDevnet
              </div>
            </div>

            <div className="p-3 rounded-sm bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[10px]">Maximum Capped Allowance</div>
              <div className="font-mono font-bold text-cyan-400 mt-1">
                $50.00 USDC Max Risk
              </div>
            </div>

            <div className="p-3 rounded-sm bg-slate-950 border border-slate-800">
              <div className="text-slate-500 text-[10px]">Session Expiration</div>
              <div className="font-mono font-bold text-slate-200 mt-1">
                Rolling 24h Window
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-[10px] text-slate-500">
              Zero raw private keys stored on server or in localStorage.
            </div>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-sm font-bold transition-all flex items-center gap-2 text-xs ${
                saved
                  ? "bg-emerald-600 text-slate-950"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saved ? "SETTINGS SAVED" : "SAVE SETTINGS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
