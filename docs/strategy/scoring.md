# NEXORA Strategy — Normalized 0–100 Opportunity Scoring System

> **Module:** Scoring & Weight Matrix (`packages/strategy`)  
> **Identifier:** NEX-SCORING-V1  
> **Companion Files:** [`signals.md`](file:///e:/hackathon_solana/docs/strategy/signals.md), [`strategy.md`](file:///e:/hackathon_solana/docs/strategy/strategy.md)  

---

## 1. Master Composite Scoring Formula

The Opportunity Score $S_{\text{opp}} \in [0.0, 100.0]$ is computed as the normalized dot product of the individual signal vectors and their assigned factor weights:

$$S_{\text{opp}} = 100 \times \left( \sum_{i=1}^{9} w_i \cdot S_i \right) \times S_{\text{risk}}$$

*Note: $S_{\text{risk}}$ acts as a multiplicative veto gate. If $S_{\text{risk}} = 0$, $S_{\text{opp}} = 0.0$.*

---

## 2. Factor Weighting Allocation & Rationale

| Signal Indicator | Variable | Weight ($w_i$) | Category | Quantitative Justification |
|---|---|---|---|---|
| **Volume Acceleration** | $S_{\text{vol}}$ | **15%** | Flow | Volume spikes precede major onchain trend shifts. |
| **Price Momentum** | $S_{\text{mom}}$ | **15%** | Momentum | Directional confirmation across 15m and 5m periods. |
| **Base Liquidity Depth** | $S_{\text{liq}}$ | **15%** | Liquidity | Ensures executable capacity without adverse slippage. |
| **Buy/Sell Imbalance (OFI)** | $S_{\text{ofi}}$ | **10%** | Flow | Confirms net aggressive taker demand over passive sellers. |
| **Liquidity Delta** | $S_{\Delta\text{liq}}$ | **10%** | Liquidity | Prevents entering pools experiencing liquidity flight. |
| **Market Structure** | $S_{\text{struct}}$ | **10%** | Structure | Filters out choppy consolidations in favor of clean breakouts. |
| **Volatility Quality** | $S_{\text{vol\_qual}}$ | **8%** | Quality | Rewards smooth trending moves over discontinuous tick jumps. |
| **Holder Distribution** | $S_{\text{holder}}$ | **7%** | Safety | Protects against single-whale dumping manipulation. |
| **Token Risk Gate** | $S_{\text{risk}}$ | **10%** (Gate) | Security | Hard security veto on mint/freeze authority. |
| **Social Signal** | $S_{\text{soc}}$ | **0%** | Future | Zero-weighted in MVP to ensure 100% deterministic backtesting. |
| **Total** | | **100%** | | |

---

## 3. Action Thresholds & State Dispatches

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THRESHOLD ACTION DISPATCH TABLE                       │
├─────────────────────┬──────────────────┬────────────────────────────────────┤
│ SCORE RANGE         │ CLASSIFICATION   │ AGENT SYSTEM DISPATCH              │
├─────────────────────┼──────────────────┼────────────────────────────────────┤
│ 75.0 – 100.0        │ BUY              │ Advance to AI Analyst & Risk Gate  │
│ 60.0 – 74.9         │ WATCH            │ Add to Fast-Poll Stream (1s tick)  │
│ 45.0 – 59.9         │ HOLD             │ Maintain existing position checks  │
│ 0.0 – 44.9          │ AVOID            │ Immediate drop; blacklist if risk=0│
└─────────────────────┴──────────────────┴────────────────────────────────────┘
```

---

## 4. Score Sensitivity Analysis & Edge-Case Protection

### Case A: "Meme Coin Pump with No Liquidity"
- Momentum $S_{\text{mom}} = 1.0$, Volume $S_{\text{vol}} = 1.0$.
- Liquidity $S_{\text{liq}} = 0.10$ ($15k TVL), Holder $S_{\text{holder}} = 0.20$.
- **Resulting Score:** $S_{\text{opp}} \approx 52.4$ ➔ **`HOLD/AVOID`** (Automatically protected from low-liquidity traps).

### Case B: "Meteora High-Yield DLMM Breakout"
- Momentum $S_{\text{mom}} = 0.85$, Volume $S_{\text{vol}} = 0.90$.
- Liquidity $S_{\text{liq}} = 0.80$ ($500k TVL), OFI $S_{\text{ofi}} = 0.88$, Risk $S_{\text{risk}} = 1.0$.
- **Resulting Score:** $S_{\text{opp}} \approx 84.6$ ➔ **`BUY`** (Dispatched for execution).

### Case C: "High-Volume Rugpull / Mint Authority Active"
- Momentum $S_{\text{mom}} = 0.95$, Volume $S_{\text{vol}} = 0.95$.
- Token Risk $S_{\text{risk}} = 0.0$ (Mint authority not revoked).
- **Resulting Score:** $S_{\text{opp}} = 0.0$ ➔ **`AVOID & BLACKLIST`** (Hard zero veto).
