# NEXORA — Complete UI/UX Architecture Specification

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline UX Specification  
> **Target Track:** Solana Hackathon — AI & DeFi Infrastructure  
> **Document Identifier:** NEX-UX-V1  
> **UX Mandate:** **INSTITUTIONAL QUANTITATIVE TERMINAL WITH INSTANT SCAN-ABILITY.**  

---

## 1. UX Philosophy & The "5-Second Dashboard Rule"

NEXORA is designed as a **high-density, mission-critical quantitative workstation**. 

When a trader or capital allocator opens the primary dashboard, the interface must answer all **9 core operational questions within 5 seconds** without requiring scrolling or page transitions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE 5-SECOND DASHBOARD AUDIT                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. Is the agent running?             │ Live Pulsing State Pill in Top Bar   │
│ 2. What is it doing right now?       │ Active Cycle Subtitle ("SCANNING...")│
│ 3. How much capital is deployed?     │ Capital Allocation Meter ($ / %)     │
│ 4. What is the current PnL?          │ Big Number Tabular PnL (+4.28% / $)  │
│ 5. What are the active positions?    │ Pinned High-Density Position Grid    │
│ 6. What opportunity is analyzed?     │ Real-Time Market Discovery Spotlight │
│ 7. Why was the last decision made?   │ Decision Ledger Top Card + Rationale │
│ 8. Is the system healthy?            │ RPC / Jupiter Latency & Block Height │
│ 9. What risk limits are active?      │ Mini Risk Invariant Badge Bar        │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Global Terminal Navigation & Header Layout

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [NEXORA]   Terminal   Markets   Reasoning   Positions   Portfolio   Risk   Settings   [Health: 18ms] [Devnet▼]│
│ STATE: ● ACTIVE (Cycle #1,428 | ANALYZING Meteora SOL/USDC)           [CAPITAL: $2,500 / $10,000 (25%)] [KILL-SWITCH]│
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Brand & Mode:** Left-aligned minimalist geometric logomark + Network switcher (`DEVNET` / `PAPER` / `MAINNET`).
- **Global Status Bar:** Displays active loop state (`IDLE`, `SCANNING`, `ANALYZING`, `EXECUTING`, `MONITORING`), cycle count, and current focused token pair.
- **Top Metrics:** Capital deployed vs. total equity, live session PnL badge.
- **Emergency Kill-Switch:** High-priority crimson-bordered pill button anchored in top right.

---

## 3. Screen-by-Screen Layout Specifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           16 CORE TERMINAL SCREENS                          │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 1. Landing Page   │ 5. Market Detail  │ 9. Portfolio      │ 13. Tx Detail   │
│ 2. App Dashboard  │ 6. Agent Reasoning│ 10. Risk Controls │ 14. Strat Config│
│ 3. Agent Overview │ 7. Open Positions │ 11. Agent Settings│ 15. System Health│
│ 4. Market Scanner │ 8. Trade History  │ 12. Wallet Admin  │ 16. Onboarding  │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

---

### Screen 1: Institutional Landing Page (`/`)
- **Purpose:** Protocol value proposition, verifiable architecture breakdown, and one-click Terminal launch.
- **Hero Section:** High-contrast value statement: *"Autonomous Intelligence for Onchain Markets"*, live read-only telemetry preview (Total Processed Volume, Win Rate, Mean Invariant Latency: 12ms), primary CTA: `[Launch Terminal (Devnet/Paper)]`.
- **Architecture Section:** Interactive visual flow diagram illustrating: `AI Discovery` ➔ `Deterministic Risk Shield` ➔ `Jupiter / Meteora Atomic Execution`.
- **Live Strategy Backtest Preview:** Interactive Chart.js equity curve comparing Nexora DMLH-v1 vs. Passive SOL Holding.

---

### Screen 2: Master App Dashboard (`/dashboard`)
- **Layout:** 3-Column Quantitative Grid (Desktop 1440px+).

```
┌────────────────────────┬──────────────────────────────────────┬────────────────────────┐
│ 1. LIVE OPPORTUNITIES  │ 2. FOCUSED ASSET CHART & DEPTH       │ 3. ACTIVE POSITIONS    │
│ (Score >= 70 Stream)   │ • Meteora SOL/USDC Candlestick (15m) │ • SOL/USDC Long (+4.2%)│
│ • SOL/USDC (Score: 88) │ • Active Bin Distribution (DLMM)     │ • JUP/USDC Long (+1.8%)│
│ • JUP/USDC (Score: 79) │ • Real-Time Order Flow Imbalance     ├────────────────────────┤
│ • BONK/USDC(Score: 64) ├──────────────────────────────────────┤ 4. DECISION LEDGER     │
├────────────────────────┤ 5. PORTFOLIO TELEMETRY STRIP         │ • #1428: BUY Approved  │
│ 6. SYSTEM RISK BADGES  │ • Total Equity: $10,428.50 USDC      │ • #1427: REJECT (Slip) │
│ • Max Size: 10% ($1k)  │ • 24h PnL: +$428.50 (+4.28%)         │ • #1426: TP1 Triggered │
│ • Max Drawdown: -5.0%  │ • Cash Reserve: $7,928.50 (76%)      │ • #1425: AVOID (Vol)   │
└────────────────────────┴──────────────────────────────────────┴────────────────────────┘
```

---

### Screen 3: Agent Overview (`/agent`)
- **Purpose:** Deep telemetry on agent state machine, cycle frequency, and sub-module latency.
- **Components:**
  - Active State Inspector (Displays current phase in state machine with millisecond timer).
  - Module Performance Latency Waterfall (Ingest: 42ms ➔ Features: 18ms ➔ AI Inference: 1.4s ➔ Risk Engine: 4ms ➔ Simulation: 120ms).
  - State Transition History Log.

---

### Screen 4: Live Market Scanner (`/scanner`)
- **Purpose:** Filterable onchain screener across all Meteora DLMM and Jupiter pools.
- **Columns:** `Pair`, `DEX Venue`, `Price (USDC)`, `24h Volume`, `TVL Depth`, `DLMM Fee APR`, `OFI Imbalance`, `Score (0-100)`, `Action State`.
- **Controls:** Multi-select filters (`Min TVL $50k+`, `Score > 75`, `Meteora Only`, `Jupiter Verified`).

---

### Screen 5: Market Detail (`/market/[pair]`)
- **Purpose:** Deep quantitative breakdown of a specific candidate pair.
- **Visuals:**
  - High-resolution Candlestick Chart (1m, 5m, 15m, 1h) with volume profile.
  - Meteora DLMM Active Bin Visualizer (Liquidity distribution across discrete price bins).
  - Feature Vector Breakdown (Radar chart / bar breakdown of the 10 quantitative signals).

---

### Screen 6: Agent Reasoning & Decision Ledger (`/reasoning`)
- **Purpose:** Full explainable AI audit trail.
- **Card Breakdown:**
  - **Context:** Market features at time of decision.
  - **AI Hypothesis:** Structured JSON payload, confidence score, suggested invalidation price.
  - **Deterministic Risk Verdict:** `APPROVED` (Green) or `REJECTED` (Crimson with exact invariant failure code).
  - **Transaction Receipt:** Onchain signature link (Solana Explorer / Solscan).

---

### Screen 7: Open Positions (`/positions`)
- **Purpose:** Real-time position tracking and manual override controls.
- **Table Data:** `Asset`, `Direction`, `Entry Price`, `Current Price`, `Position Size (USDC)`, `Unrealized PnL ($ / %)`, `SL Price`, `TP1 / TP2`, `Time Held`, `Emergency Unwind Button`.

---

### Screen 8: Trade History & Performance (`/history`)
- **Purpose:** Historical log of all closed trades, win rate %, profit factor, and fee expenditures.
- **Visuals:** Cumulative Equity Growth Curve, Trade Distribution Bar Chart (Wins vs. Losses), CSV/JSON Export.

---

### Screen 9: Portfolio & Balance Breakdown (`/portfolio`)
- **Purpose:** Account-level capital allocation and asset breakdown.
- **Visuals:** Allocation Donut (Free USDC vs. Active Tokens vs. Locked DLMM Positions), 30-Day Drawdown Watermark Chart.

---

### Screen 10: Risk Controls & Invariant Config (`/risk`)
- **Purpose:** User-governed hard risk policy editor.
- **Controls:**
  - Max Position Size Slider (1.0% – 10.0%).
  - 24h Daily Drawdown Circuit Breaker Slider (-1.0% – -10.0%).
  - Maximum Slippage Tolerance Stepper (10 bps – 200 bps).
  - Allowed Quote Asset Whitelist Toggles.
  - Save & Enforce Button (Generates cryptographic signature challenge).

---

### Screen 11: Agent Settings (`/settings`)
- **Purpose:** Execution environment toggles, cycle loop frequency (5s – 30s), AI model selection, RPC endpoint management.

---

### Screen 12: Wallet & Session Admin (`/wallet`)
- **Purpose:** Connected primary wallet info, ephemeral session keypair status, balance sweep, and signature history.

---

### Screen 13: Transaction Detail (`/tx/[signature]`)
- **Purpose:** Forensic breakdown of an individual onchain execution (Compute Units, Priority Fee, Jupiter route hops, balance changes).

---

### Screen 14: Strategy Configuration (`/strategy`)
- **Purpose:** Fine-tuning factor weights ($w_i$) for the Opportunity Scorer and toggling market regime rules.

---

### Screen 15: System Health & Telemetry (`/health`)
- **Purpose:** Live network metrics (Solana cluster TPS, RPC ping, Jupiter API status, Meteora program availability, WebSocket frame drop rate).

---

### Screen 16: Interactive Onboarding Modal
- **Purpose:** 3-step setup for first-time users:
  1. Select Execution Mode (`Paper Trading` Recommended).
  2. Confirm Default Safe Risk Envelope (Max 5% trade, -3% daily loss).
  3. Connect Wallet or Launch Simulated Agent.

---

## 4. Micro-Interactions & State Transition Rules

All micro-interactions follow the **`ui-taste` craft standards**:

1. **Price Tick Flash:** When a watched price updates, the cell background flashes subtle emerald (`rgba(0,192,135,0.12)`) or crimson (`rgba(255,77,100,0.12)`) for **120ms** and fades cleanly.
2. **State Transition Banner:** When the agent transitions states (e.g. `SCANNING` ➔ `EXECUTING`), the state pill morphs with a subtle **100ms** cubic-bezier ease.
3. **Kill-Switch Engagement:** Clicking the Kill-Switch produces an immediate high-contrast red border pulse and opens a modal with default focus on `Confirm Emergency Pause`.
4. **No Gratuitous Animation:** Charts do not animate on initial render or periodic refresh; they update data points instantaneously to prevent cognitive distraction.

---

## 5. System State Specifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM STATES BREAKDOWN                            │
├─────────────────────┬───────────────────────────────────────────────────────┤
│ STATE               │ UI REPRESENTATION                                     │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ **1. Loading**      │ Monochromatic hairline skeleton pulse (no layout shift)│
│ **2. Empty**        │ Clean outline icon + "No opportunities meet score ≥75"│
│ **3. Error**        │ Inline amber/crimson badge with exact recovery action │
│ **4. Disconnected** │ Persistent top amber strip: "Wallet Disconnected"     │
│ **5. Degraded**     │ "RPC Latency High (>1200ms) - Polling fallback active"│
└─────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 6. Responsive Breakpoint Matrix

| Viewport | Target Resolution | Panel Layout & Adaptation |
|---|---|---|
| **Desktop (2K / 4K)** | $\ge 1920\text{px}$ | 4-Column Ultra-Density Terminal (Full chart, orderbook, depth, ledger). |
| **Desktop (Standard)**| $1440\text{px} - 1919\text{px}$ | 3-Column Standard Workstation (Scanner left, Chart center, Positions right). |
| **Tablet / Laptop** | $1024\text{px} - 1439\text{px}$ | 2-Column Layout (Collapsible left scanner drawer). |
| **Mobile** | $< 1023\text{px}$ | Single-Column Tabbed Terminal with persistent bottom navigation. |
