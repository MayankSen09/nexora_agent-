# NEXORA Strategy — Core Architecture & Market Regime Engine

> **Module:** Strategy Architecture (`packages/strategy`)  
> **Identifier:** NEX-STRAT-CORE  
> **Companion Files:** [`signals.md`](file:///e:/hackathon_solana/docs/strategy/signals.md), [`scoring.md`](file:///e:/hackathon_solana/docs/strategy/scoring.md)  

---

## 1. Strategy Scope & Multi-Timeframe Framework

The **Dynamic Momentum & Liquidity Harvester (DMLH-v1)** operates across three distinct timeframes to maintain structural trend alignment while timing micro-entries on Solana blocks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MULTI-TIMEFRAME CONVERGENCE                           │
├───────────────────────┬───────────────────────────┬─────────────────────────┤
│ MACRO REGIME (1H / 4H)│ INTERMEDIATE TREND (15M)  │ MICRO EXECUTION (1M / 5M│
├───────────────────────┼───────────────────────────┼─────────────────────────┤
│ • Solana Market Beta  │ • Pool Liquidity Dynamics │ • Active Bin Imbalances │
│ • SOL & USDC Regimes  │ • 15m Volume Expansion    │ • Jupiter Price Impact  │
│ • Macro Trend Filter  │ • Relative Strength (RS)  │ • Micro Spread & Ticks  │
└───────────────────────┴───────────────────────────┴─────────────────────────┘
```

---

## 2. Market Regime Classifier

The strategy alters its sensitivity and sizing parameters based on the detected macro volatility regime:

```mermaid
graph TD
    Market[Solana Real-Time Market Ticks] --> VolCalc[Calculate 1h Realized Volatility σ]
    VolCalc --> RegimeCheck{Evaluate Volatility Regime}
    
    RegimeCheck -->|σ < 1.5%| R1[LOW VOLATILITY: Scalp Mode]
    RegimeCheck -->|1.5% <= σ <= 4.0%| R2[TRENDING NORMAL: Optimal Harvester Mode]
    RegimeCheck -->|σ > 4.0%| R3[HIGH VOLATILITY: Defensive Capital Preservation]
    
    R1 --> S1[TP: +4% | SL: -2% | Max Size: 10%]
    R2 --> S2[TP: +6% / +12% | SL: -3% | Max Size: 10%]
    R3 --> S3[TP: +8% | SL: -2.5% | Max Size: 5% (Reduced)]
```

### Regime Parameter Table
| Regime | Condition ($\sigma_{1\text{h}}$) | Target Hold Time | Take Profit Targets | Stop Loss | Max Sizing |
|---|---|---|---|---|---|
| **Low Volatility** | $\sigma < 1.5\%$ | 30 minutes | +4.0% (Single Exit) | -2.0% | 10.0% Equity |
| **Normal Trending** | $1.5\% \le \sigma \le 4.0\%$ | 45 minutes | +6.0% (TP1), +12.0% (TP2) | -3.0% | 10.0% Equity |
| **Extreme Volatility** | $\sigma > 4.0\%$ | 15 minutes | +8.0% (Single Exit) | -2.5% | 5.0% Equity (Halved) |

---

## 3. Meteora DLMM & Dynamic AMM Exploitation Logic

Unlike simple constant-product AMMs ($x \cdot y = k$), Meteora DLMM concentrates liquidity into discrete price bins with dynamic fee scaling during volatility surges:

1. **Active Bin Trajectory:** The strategy measures whether volume is concentrating in upper bins (bullish order flow) and harvests the amplified dynamic fee APR.
2. **Volatility Fee Multiplier:** During high-velocity volume bursts, Meteora base fees surge dynamically from 0.15% to > 2.50%. The strategy targets pools where fee growth exceeds liquidity dilution.
3. **Bin Depletion Guard:** If liquidity in adjacent bins drops below $10,000 USDC, the pair is flagged as illiquid and excluded from entry.
