# NEXORA Strategy — Position Sizing & Capital Allocation Engine

> **Module:** Capital Sizing (`packages/strategy` + `packages/risk-engine`)  
> **Identifier:** NEX-SIZING-V1  
> **Companion Files:** [`scoring.md`](file:///e:/hackathon_solana/docs/strategy/scoring.md), [`exit-rules.md`](file:///e:/hackathon_solana/docs/strategy/exit-rules.md)  

---

## 1. Capital Allocation Philosophy

Position sizing in Nexora is strictly **non-linear, risk-bounded, and volatility-adjusted**. The AI model can suggest an optimal size, but the **Deterministic Risk Engine enforces mathematical bounds** based on portfolio equity, market volatility, and current exposure.

---

## 2. Mathematical Position Sizing Model

### 2.1 Volatility-Adjusted Sizing Formula
The base dollar position size $\text{Size}_{\text{USD}}$ is determined by targeting a fixed dollar portfolio risk per trade ($R_{\text{target}} = 1.0\%$ of total equity):

$$\text{Size}_{\text{USD}} = \min\left(\text{Cap}_{\text{max}}, \; \frac{\text{Equity}_{\text{portfolio}} \cdot R_{\text{target}}}{|\text{StopLoss}_{\text{pct}}|} \cdot \left(\frac{S_{\text{opp}}}{100}\right)\right)$$

Where:
- $\text{Equity}_{\text{portfolio}}$ = Total current USDC portfolio valuation.
- $R_{\text{target}}$ = Target risk budget per trade (Default: $1.0\%$ of equity).
- $\text{StopLoss}_{\text{pct}}$ = Distance to invalidation price (Default: $3.0\%$).
- $S_{\text{opp}}$ = Opportunity Score ($75.0$ to $100.0$).
- $\text{Cap}_{\text{max}}$ = Hard maximum position ceiling ($10.0\%$ of equity).

---

### 2.2 Sizing Calculation Example
- **Portfolio Equity:** $\$10{,}000\text{ USDC}$
- **Target Risk ($R_{\text{target}}$):** $1.0\% = \$100\text{ USDC}$
- **Stop Loss ($\text{SL}$):** $3.0\%$ ($0.03$)
- **Opportunity Score ($S_{\text{opp}}$):** $85.0$ ($0.85$)

$$\text{Raw Sizing} = \frac{\$10{,}000 \cdot 0.01}{0.03} \cdot 0.85 = \frac{\$100}{0.03} \cdot 0.85 = \$3{,}333.33 \cdot 0.85 = \$2{,}833.33$$

$$\text{Hard Cap Check} = 10\% \text{ of } \$10{,}000 = \$1{,}000.00$$

$$\text{Final Clamped Size} = \min(\$1{,}000.00, \; \$2{,}833.33) = \mathbf{\$1{,}000.00\text{ USDC}}$$

---

## 3. Hard Risk Sizing Limits

| Invariant Parameter | Limit Value | Enforcement Behavior |
|---|---|---|
| **Max Single Position Size** | **$10.0\%$** of Portfolio Equity | Clamps any larger request to 10% max. |
| **Min Single Position Size** | **$\$25.00\text{ USDC}$** | Rejects trade if calculated size is below minimum gas efficiency. |
| **Max Total Active Exposure** | **$30.0\%$** of Portfolio Equity | Prevents opening new positions if total active allocations $\ge 30\%$. |
| **Max Concurrent Positions** | **$3$ Positions** | Rejects new buy signals until an active position exits. |
| **Free Cash Reserve Buffer** | **$70.0\%$** of Portfolio Equity | Guarantees liquidity preservation during market drawdowns. |
