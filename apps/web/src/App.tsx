import React, { useState, useEffect } from "react";
import {
  CandidateMarket,
  AgentTelemetry,
  Position,
  Trade,
  TransactionRecord,
  DecisionLedgerRecord,
  PortfolioSummary,
  GetSystemHealthResponse,
  PROTOCOL_CONSTANTS,
} from "@nexora/shared";
import { Header } from "./components/Header";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";
import { AgentView } from "./components/AgentView";
import { ScannerView } from "./components/ScannerView";
import { PositionsView } from "./components/PositionsView";
import { PortfolioView } from "./components/PortfolioView";
import { TradeHistoryView } from "./components/TradeHistoryView";
import { RiskControlsView } from "./components/RiskControlsView";
import { SettingsView } from "./components/SettingsView";
import { TransactionsView } from "./components/TransactionsView";
import { SystemHealthView } from "./components/SystemHealthView";
import { ReasoningView } from "./components/ReasoningView";
import { MarketDetailModal } from "./components/MarketDetailModal";
import { KillSwitchModal } from "./components/KillSwitchModal";
import { OnboardingModal } from "./components/OnboardingModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [markets, setMarkets] = useState<CandidateMarket[]>([]);
  const [telemetry, setTelemetry] = useState<AgentTelemetry | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionLedgerRecord[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [health, setHealth] = useState<GetSystemHealthResponse | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<CandidateMarket | null>(null);
  const [inspectMarket, setInspectMarket] = useState<CandidateMarket | null>(null);
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch operational telemetry and market state from real API
  const fetchData = async () => {
    try {
      const [mktRes, agentRes, posRes, trdRes, txRes, decRes, portRes, healthRes] =
        await Promise.all([
          fetch("/api/markets").then((r) => r.json()).catch(() => null),
          fetch("/api/agent").then((r) => r.json()).catch(() => null),
          fetch("/api/positions").then((r) => r.json()).catch(() => null),
          fetch("/api/trades").then((r) => r.json()).catch(() => null),
          fetch("/api/transactions").then((r) => r.json()).catch(() => null),
          fetch("/api/decisions").then((r) => r.json()).catch(() => null),
          fetch("/api/portfolio").then((r) => r.json()).catch(() => null),
          fetch("/api/system/health").then((r) => r.json()).catch(() => null),
        ]);

      if (mktRes?.success) {
        setMarkets(mktRes.data.markets);
        if (!selectedMarket && mktRes.data.markets.length > 0) {
          setSelectedMarket(mktRes.data.markets[0]);
        }
      }
      if (agentRes?.success) setTelemetry(agentRes.data.telemetry);
      if (posRes?.success) setPositions(posRes.data.positions);
      if (trdRes?.success) setTrades(trdRes.data.trades);
      if (txRes?.success) setTransactions(txRes.data.transactions);
      if (decRes?.success) setDecisions(decRes.data.decisions);
      if (portRes?.success) setPortfolio(portRes.data.summary);
      if (healthRes?.success) setHealth(healthRes.data);
    } catch (err) {
      console.error("[NEXORA API] Telemetry Polling Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAgent = async () => {
    try {
      if (telemetry?.state === "PAUSED" || telemetry?.emergencyStopped) {
        await fetch("/api/agent/start", { method: "POST" });
      } else {
        await fetch("/api/agent/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "OPERATOR_PAUSE" }),
        });
      }
      fetchData();
    } catch (err) {
      console.error("Failed to toggle agent state:", err);
    }
  };

  const handlePanicKill = async (liquidate: boolean) => {
    try {
      await fetch("/api/agent/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "EMERGENCY_KILL_SWITCH",
          panicLiquidate: liquidate,
        }),
      });
      setKillSwitchModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Kill switch error:", err);
    }
  };

  const handleClosePosition = async (id: string) => {
    try {
      await fetch(`/api/positions/${id}/close`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.error("Failed to close position:", err);
    }
  };

  const handleExecuteSimulatedTrade = (market: CandidateMarket) => {
    // Switch to terminal tab
    setSelectedMarket(market);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Navigation & Operational Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={telemetry}
        portfolio={portfolio}
        health={health}
        onToggleAgent={handleToggleAgent}
        onOpenKillSwitch={() => setKillSwitchModalOpen(true)}
        onOpenOnboarding={() => setOnboardingModalOpen(true)}
      />

      {/* 2. Main Workstation Body with Seamless State Switching */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === "landing" && (
          <LandingView
            onLaunchTerminal={() => setActiveTab("dashboard")}
            onOpenOnboarding={() => setOnboardingModalOpen(true)}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            markets={markets}
            telemetry={telemetry}
            positions={positions}
            decisions={decisions}
            portfolio={portfolio}
            health={health}
            selectedMarket={selectedMarket}
            onSelectMarket={(m) => setSelectedMarket(m)}
            onInspectMarket={(m) => setInspectMarket(m)}
            onClosePosition={handleClosePosition}
            onOpenKillSwitch={() => setKillSwitchModalOpen(true)}
            loading={loading}
          />
        )}

        {activeTab === "agent" && (
          <AgentView
            telemetry={telemetry}
            onToggleAgent={handleToggleAgent}
            onOpenKillSwitch={() => setKillSwitchModalOpen(true)}
          />
        )}

        {activeTab === "scanner" && (
          <ScannerView
            markets={markets}
            onSelectMarket={(m) => setSelectedMarket(m)}
            onInspectMarket={(m) => setInspectMarket(m)}
          />
        )}

        {activeTab === "reasoning" && <ReasoningView decisions={decisions} />}

        {activeTab === "positions" && (
          <PositionsView
            positions={positions}
            portfolio={portfolio}
            onClosePosition={handleClosePosition}
            onOpenKillSwitch={() => setKillSwitchModalOpen(true)}
          />
        )}

        {activeTab === "portfolio" && <PortfolioView portfolio={portfolio} />}

        {activeTab === "history" && <TradeHistoryView trades={trades} />}

        {activeTab === "risk" && (
          <RiskControlsView onOpenKillSwitch={() => setKillSwitchModalOpen(true)} />
        )}

        {activeTab === "settings" && <SettingsView />}

        {activeTab === "transactions" && <TransactionsView transactions={transactions} />}

        {activeTab === "health" && <SystemHealthView health={health} />}
      </main>

      {/* 3. Footer Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">{PROTOCOL_CONSTANTS.NAME}</span>
          <span>v{PROTOCOL_CONSTANTS.VERSION}</span>
          <span>•</span>
          <span className="text-emerald-400">Solana Devnet</span>
          <span>•</span>
          <span>Non-Custodial Anchor PDA</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="hidden sm:inline">The AI Decides. The Risk Shield Controls. The Blockchain Executes.</span>
          <span className="text-emerald-400 font-bold">100% Armed</span>
        </div>
      </footer>

      {/* 4. Interactive Modals */}
      <MarketDetailModal
        market={inspectMarket}
        onClose={() => setInspectMarket(null)}
        onExecuteSimulatedTrade={handleExecuteSimulatedTrade}
      />

      <KillSwitchModal
        isOpen={killSwitchModalOpen}
        onClose={() => setKillSwitchModalOpen(false)}
        onPanicKill={handlePanicKill}
      />

      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        onLaunchTerminal={() => {
          setOnboardingModalOpen(false);
          setActiveTab("dashboard");
        }}
      />
    </div>
  );
}
