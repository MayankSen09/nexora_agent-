# NEXORA — Software Requirements Specification (SRS)

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline Specification  
> **Target Track:** Solana Hackathon — AI & DeFi Infrastructure  
> **Document Identifier:** NEX-SRS-V1  
> **Companion Document:** [`docs/01_PRD.md`](file:///e:/hackathon_solana/docs/01_PRD.md)  

---

## 1. System Overview & Scope

NEXORA is an autonomous, onchain capital allocation system for Solana that pairs probabilistic AI opportunity discovery with a deterministic risk engine and cryptographic policy validation.

This document defines the functional and non-functional engineering requirements for the Nexora system, its components, data schemas, security invariants, and acceptance criteria.

---

## 2. System Actors & User Roles

### 2.1 System Actors
| Actor ID | Actor Name | Description |
|---|---|---|
| **ACT-01** | **Operator / Trader** | Human user who connects a wallet, configures risk parameters, monitors execution, and retains emergency override control. |
| **ACT-02** | **Nexora Autonomous Agent** | Background execution daemon executing the continuous Market Discovery → AI Analysis → Risk Evaluation → Order Loop. |
| **ACT-03** | **Solana RPC Cluster** | Network nodes providing account states, block subscriptions, transaction broadcasts, and finality confirmations. |
| **ACT-04** | **Jupiter API / Meteora Programs** | Onchain liquidity venues providing quote routing, pool states, dynamic fees, and atomic swap execution. |
| **ACT-05** | **AI Inference Engine** | Reasoning service (local or remote LLM) generating structured trade hypotheses from feature vectors. |

### 2.2 User Roles
| Role | Capabilities |
|---|---|
| **Viewer** | Read-only access to terminal UI, live opportunity streams, public charts, and historical decision logs. |
| **Trader (Paper)** | Can run simulated agent sessions, test strategies against live mainnet/devnet market feeds without capital risk. |
| **Trader (Devnet)** | Can execute live test transactions on Solana Devnet with faucet SOL/USDC. |
| **Operator (Live/Opt-in)** | Can authorize real-money mainnet trading under hardware or local keypair control strictly within deterministic risk caps. |

---

## 3. Functional Requirements (FR)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REQUIREMENTS TAXONOMY                            │
├─────────────────┬─────────────────┬────────────────────┬────────────────────┤
│ FR-AUTH: Auth   │ FR-MKT: Market  │ FR-AI: Intelligence│ FR-RISK: Risk      │
│ FR-WLT: Wallet  │ FR-DATA: Data   │ FR-STRAT: Strategy │ FR-EXEC: Execution │
│ FR-AGT: Agent   │ FR-POS: Position│ FR-PORT: Portfolio │ FR-AUDIT: Audit    │
└─────────────────┴─────────────────┴────────────────────┴────────────────────┘
```

---

### 3.1 Authentication & Wallet Requirements

#### `FR-AUTH-001`: Client-Side Session Authentication
- **Description:** The system shall authenticate user sessions locally using standard Solana public key signatures (Sign-In with Solana / SIWS) without centralized passwords or third-party OAuth.
- **Acceptance Criteria:**
  - Connecting a Solana wallet verifies cryptographic ownership of the public key.
  - Session state persists in local encrypted storage. Disconnecting clears session secrets.

#### `FR-WLT-001`: Multi-Wallet Adapter Support
- **Description:** The system shall support standard Solana Wallet Adapter interfaces (Phantom, Solflare, Backpack, Ledger).
- **Acceptance Criteria:**
  - Automatic detection of injected browser extensions.
  - Graceful rejection handling if the user denies connection.

#### `FR-WLT-002`: Ephemeral Delegated Keypair (Optional Automation Mode)
- **Description:** The system shall allow users to generate a sandboxed, local session keypair funded with capped capital (e.g. 50 USDC) to execute autonomous high-frequency micro-swaps without popups per block.
- **Acceptance Criteria:**
  - Session private keys are held in memory only and never sent over the network.
  - User can revoke or sweep session funds back to primary wallet in one transaction.

---

### 3.2 Agent & Lifecycle Requirements

#### `FR-AGT-001`: Autonomous Execution Loop
- **Description:** The agent shall run a deterministic, configurable interval loop (e.g. 5s – 30s) executing:
  `Ingest → Filter → Feature Extraction → AI Inference → Deterministic Risk Check → Dispatch → Monitor`.
- **Acceptance Criteria:**
  - Agent state transitions: `INITIALIZING` ➔ `SCANNING` ➔ `ANALYZING` ➔ `EVALUATING_RISK` ➔ `EXECUTING` ➔ `MONITORING` ➔ `PAUSED` ➔ `ERROR`.
  - Loop execution time does not block UI rendering.

#### `FR-AGT-002`: Global Emergency Kill-Switch
- **Description:** The system shall provide an instantaneous, single-click Kill-Switch accessible from every screen.
- **Acceptance Criteria:**
  - Triggering the kill-switch halts all active autonomous loops within < 100ms.
  - Provides a secondary prompt: `Cancel pending orders` or `Panic-liquidate open positions to USDC`.

---

### 3.3 Market Discovery & Data Requirements

#### `FR-MKT-001`: Meteora DLMM & Dynamic AMM Discovery
- **Description:** The system shall continuously query Meteora API & RPC program accounts to discover pools paired with USDC or SOL.
- **Acceptance Criteria:**
  - Extracts Pool Address, Token A/B mints, 24h Fee Volume, Active Bin ID, Liquidity Depth ($), and Base Fee APR.
  - Filters out pools with TVL < $25,000 or 24h Volume < $10,000.

#### `FR-MKT-002`: Jupiter Aggregator Route Discovery
- **Description:** The system shall fetch real-time route depth, price impact, and split routing from Jupiter v6 API for candidate token pairs.
- **Acceptance Criteria:**
  - Rejects pairs with estimated price impact > 1.0% for minimum trade size.

#### `FR-DATA-001`: Feature Extraction Pipeline
- **Description:** The system shall compute quantitative technical features for discovered markets:
  1. Price Momentum (5m, 15m, 1h % change).
  2. Volume-to-Liquidity Ratio ($V/L$).
  3. Realized Volatility ($\sigma$).
  4. Bid-Ask Spread & Fee tier efficiency.
- **Acceptance Criteria:**
  - Feature vectors are normalized and timestamped before passing to the AI layer.

---

### 3.4 AI Reasoning & Structured Inference Requirements

#### `FR-AI-001`: Strictly Typed Decision Schema
- **Description:** The AI engine shall NEVER emit unstructured free-form text to trigger actions. All AI outputs MUST adhere to the following JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NexoraTradeDecision",
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["BUY", "SELL", "HOLD", "AVOID"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "position_size_percent": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 100.0
    },
    "entry_reason": {
      "type": "string",
      "maxLength": 280
    },
    "risk_level": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH"]
    },
    "invalidation_reason": {
      "type": "string",
      "maxLength": 280
    },
    "time_horizon": {
      "type": "string",
      "enum": ["SCALP_5M", "SHORT_15M", "SWING_1H", "POSITION_4H"]
    },
    "signals": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  },
  "required": [
    "action",
    "confidence",
    "position_size_percent",
    "entry_reason",
    "risk_level",
    "invalidation_reason",
    "time_horizon",
    "signals"
  ],
  "additionalProperties": false
}
```

- **Acceptance Criteria:**
  - If AI output fails schema validation, the system treats it as `AVOID` and logs a schema validation error.
  - Natural language responses from LLMs are completely ignored by the execution engine.

#### `FR-AI-002`: Decision Explainability & Rationale Logging
- **Description:** Every generated trade decision must include a human-verifiable `entry_reason` and explicit `invalidation_reason`.
- **Acceptance Criteria:**
  - Rationales are displayed in the Decision Ledger UI with highlighted trigger signals.

---

### 3.5 Deterministic Risk Engine Requirements

```
                                  [ AI PROPOSED TRADE ]
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  DETERMINISTIC RISK GATE  │
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
       [ Max Size Cap ]             [ Drawdown Limit ]            [ Slippage Bound ]
        Pass: size ≤ 10%             Pass: DD < 5% / 24h           Pass: slip ≤ 50 bps
               │                             │                             │
               └─────────────────────────────┼─────────────────────────────┘
                                             │
                                             ▼
                                 { ALL INVARIANTS PASSED? }
                                    /                 \
                             [ YES ]                   [ NO ]
                                │                         │
                                ▼                         ▼
                        APPROVED FOR SIGNING      HARD REJECT & AUDIT LOG
```

#### `FR-RISK-001`: Immutable Risk Priority Invariant
- **Description:** The Deterministic Risk Engine operates downstream of the AI and has unilateral veto authority. No AI output can override, bypass, or loosen risk policies.
- **Acceptance Criteria:**
  - Code enforcing risk bounds is mathematically isolated and runs synchronously prior to transaction serialization.

#### `FR-RISK-002`: Maximum Position Sizing Cap
- **Description:** The system shall enforce a hard ceiling on capital allocated to a single trade.
- **Acceptance Criteria:**
  - Maximum single position size: User-configured, default `10%` of total portfolio equity.
  - Any AI proposal requesting > `MAX_POSITION_SIZE_PERCENT` is automatically clamped to the cap or rejected.

#### `FR-RISK-003`: Maximum Portfolio Drawdown Circuit Breaker
- **Description:** The system shall track rolling 24-hour portfolio drawdown.
- **Acceptance Criteria:**
  - If `Unrealized PnL + Realized PnL (24h)` drops below `-5.0%` (user-configurable), the system enters `CIRCUIT_BREAKER_TRIPPED` state.
  - Halts all new buy orders immediately.

#### `FR-RISK-004`: Maximum Permissible Slippage & Price Impact
- **Description:** The system shall reject any swap where estimated or simulated slippage exceeds safety parameters.
- **Acceptance Criteria:**
  - Default max slippage: `50 bps` (0.50%).
  - Rejects trades where Jupiter price impact > `1.0%`.

#### `FR-RISK-005`: Allowed Mint Whitelist
- **Description:** The system shall only execute trades where Quote asset is verified (USDC / SOL) and Base asset is verified in Jupiter strict token list.
- **Acceptance Criteria:**
  - Unverified or unindexed mints are rejected with `REASON_UNVERIFIED_MINT`.

---

### 3.6 Execution & Position Management Requirements

#### `FR-EXEC-001`: Multi-Mode Execution Pipeline
- **Description:** The system shall support three distinct execution environments:
  1. `PAPER_TRADING` (Simulated fills against live mainnet orderbooks, zero risk).
  2. `DEVNET` (Live Solana Devnet transactions).
  3. `MAINNET` (Live capital execution, locked behind explicit confirmation).
- **Acceptance Criteria:**
  - Application defaults to `PAPER_TRADING` on launch.
  - Switching to `MAINNET` requires explicit acknowledgment of risk and manual password/signature confirmation.

#### `FR-EXEC-002`: Atomic Swap Construction (Jupiter & Meteora)
- **Description:** The system shall construct Versioned Transactions (v0) with optimized Compute Budget priority fees.
- **Acceptance Criteria:**
  - Dynamic Priority Fee estimation based on recent block congestion.
  - Transactions include slippage bounds directly in instruction arguments.

#### `FR-POS-001`: Active Position Monitoring
- **Description:** The system shall monitor all open positions per block for mark-to-market valuation, current PnL, and exit triggers.
- **Acceptance Criteria:**
  - Updates position table every block (400ms – 1000ms).
  - Calculates Unrealized PnL (USD and %), Entry Price, Current Price, and Target SL/TP.

#### `FR-POS-002`: Deterministic Auto-Exit Evaluation
- **Description:** The position engine shall automatically trigger market exits upon reaching:
  1. **Take Profit (TP):** Target price reached (+X%).
  2. **Stop Loss (SL):** Invalidation price breached (-Y%).
  3. **Trailing Stop:** Peak price drawdown exceeds trailing threshold.
  4. **Time Expiration:** Position open duration exceeds `max_hold_time`.
- **Acceptance Criteria:**
  - Exits are executed atomically into USDC via Jupiter without waiting for human approval.

---

### 3.7 Portfolio Tracking, Audit Trail & Logging

#### `FR-PORT-001`: Real-Time Portfolio Analytics
- **Description:** The system shall calculate and render portfolio performance metrics:
  - Total Equity (USDC)
  - Allocated vs. Free Capital
  - 24h Realized / Unrealized PnL
  - Trade Win Rate % and Profit Factor
- **Acceptance Criteria:**
  - All figures rendered using tabular monospaced numbers (`tabular-nums`).

#### `FR-AUDIT-001`: Immutable Decision Audit Log
- **Description:** Every market evaluated by the AI and screened by the Risk Engine must generate a structured audit record.
- **Acceptance Criteria:**
  - Record fields: `Timestamp`, `Pair`, `AI_Confidence`, `Proposed_Action`, `Risk_Verdict` (`APPROVED` | `REJECTED`), `Rejection_Reason`, `Tx_Signature`.
  - Exportable to JSON / CSV.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance Requirements
- **`NFR-PERF-001` (Inference-to-Decision Latency):** AI structured decision generation must complete in < 2,500ms.
- **`NFR-PERF-002` (Risk Validation Latency):** Deterministic risk checks must execute in < 15ms.
- **`NFR-PERF-003` (UI Render Performance):** Terminal UI must maintain a stable 60 FPS without layout shifts or freeze on high-frequency WebSocket tick updates.
- **`NFR-PERF-004` (Transaction Confirmation):** Solana transaction signature confirmation timeout capped at 30 seconds with automatic retry on expiration.

### 4.2 Security Requirements
- **`NFR-SEC-001` (Private Key Security):** No private keys or mnemonics shall ever be logged, transmitted, or stored in plaintext.
- **`NFR-SEC-002` (Input Sanitization):** All RPC responses, token metadata, and user inputs must be schema-validated with zero evaluation of remote scripts.
- **`NFR-SEC-003` (MEV & Sandwich Protection):** All swap transactions must enforce hard minimum output amounts computed from Jupiter quotes.

### 4.3 Availability & Reliability
- **`NFR-AVAIL-001` (Graceful RPC Degradation):** If primary Solana RPC fails, the system automatically falls back to secondary RPC endpoints within < 1,000ms.
- **`NFR-AVAIL-002` (Crash Recovery):** If the browser tab or agent process restarts, open positions and risk state are recovered immediately from onchain account states.

---

## 5. Summary Traceability Matrix

| Requirement ID | Module | Priority | Target Milestone |
|---|---|---|---|
| `FR-AUTH-001` | Auth & Session | P0 (Critical) | MVP |
| `FR-WLT-001` | Wallet Adapter | P0 (Critical) | MVP |
| `FR-AGT-001` | Agent Engine | P0 (Critical) | MVP |
| `FR-AGT-002` | Kill-Switch | P0 (Critical) | MVP |
| `FR-MKT-001` | Market Discovery | P0 (Critical) | MVP |
| `FR-AI-001` | AI JSON Schema | P0 (Critical) | MVP |
| `FR-RISK-001` | Deterministic Risk | P0 (Critical) | MVP |
| `FR-RISK-002` | Sizing Caps | P0 (Critical) | MVP |
| `FR-RISK-003` | Drawdown Breaker | P0 (Critical) | MVP |
| `FR-EXEC-001` | Multi-Mode Exec | P0 (Critical) | MVP |
| `FR-POS-001` | Position Monitor | P0 (Critical) | MVP |
| `FR-POS-002` | Auto-Exit Engine | P0 (Critical) | MVP |
| `FR-AUDIT-001` | Decision Ledger | P0 (Critical) | MVP |
