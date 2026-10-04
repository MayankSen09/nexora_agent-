# NEXORA Strategy — Mathematical Signal Definitions

> **Module:** Quantitative Signals (`packages/strategy`)  
> **Identifier:** NEX-SIGNALS-V1  
> **Companion Files:** [`scoring.md`](file:///e:/hackathon_solana/docs/strategy/scoring.md), [`position-sizing.md`](file:///e:/hackathon_solana/docs/strategy/position-sizing.md)  

---

## 1. Quantitative Signal Matrix

Every signal is normalized mathematically to output a continuous floating-point value $S_i \in [0.0, 1.0]$, where `1.0` represents the maximum bullish/favorable state and `0.0` represents an unfavorable or toxic state.

---

### Signal 1: Volume Acceleration ($S_{\text{vol}}$)
Measures the velocity of recent volume relative to the baseline moving average:

$$\text{Ratio}_{\text{vol}} = \frac{\text{Volume}_{15\text{m}}}{\text{EMA}(\text{Volume}_{15\text{m}}, 20)}$$

$$S_{\text{vol}} = \min\left(1.0, \; \max\left(0.0, \; \frac{\text{Ratio}_{\text{vol}} - 0.8}{3.2}\right)\right)$$

- **Interpretation:** Value of `1.0` indicates 4x volume acceleration over the 20-period baseline.

---

### Signal 2: Price Momentum ($S_{\text{mom}}$)
Combines multi-period rate of change ($\text{ROC}$) with Exponential Moving Average alignment ($\text{EMA}_9 > \text{EMA}_{21}$):

$$\text{ROC}_{15\text{m}} = \frac{P_t - P_{t-15\text{m}}}{P_{t-15\text{m}}}$$

$$S_{\text{mom}} = \frac{1}{1 + e^{-k \cdot (\text{ROC}_{15\text{m}} - \text{threshold})}} \cdot \mathbb{I}(\text{EMA}_9 > \text{EMA}_{21})$$

- **Interpretation:** Sigmoidal transformation rewarding strong directional breakouts with short-term moving average confirmation.

---

### Signal 3: Base Liquidity Depth ($S_{\text{liq}}$)
Evaluates pool TVL and depth around the current active tick to guarantee low slippage:

$$S_{\text{liq}} = \min\left(1.0, \; \frac{\ln(\text{TVL}_{\text{USDC}}) - \ln(25{,}000)}{\ln(1{,}000{,}000) - \ln(25{,}000)}\right)$$

- **Interpretation:** Pools with $\$25{,}000$ TVL score $0.0$; pools exceeding $\$1{,}000{,}000$ TVL score $1.0$.

---

### Signal 4: Liquidity Delta ($\Delta_{\text{liq}}$)
Detects whether liquidity is entering or fleeing the pool over a 1-hour window:

$$\Delta_{\text{liq}} = \frac{\text{TVL}_t - \text{TVL}_{t-1\text{h}}}{\text{TVL}_{t-1\text{h}}}$$

$$S_{\Delta\text{liq}} = \begin{cases}
1.0 & \text{if } \Delta_{\text{liq}} \ge +10\% \\
0.5 + \frac{\Delta_{\text{liq}}}{0.20} & \text{if } -10\% < \Delta_{\text{liq}} < +10\% \\
0.0 & \text{if } \Delta_{\text{liq}} \le -10\% \quad (\text{Capital Flight Warning})
\end{cases}$$

---

### Signal 5: Buy/Sell Order Flow Imbalance ($S_{\text{ofi}}$)
Measures net taker flow across decentralized exchange trades in the last 15 minutes:

$$\text{OFI} = \frac{\text{BuyVolume}_{15\text{m}} - \text{SellVolume}_{15\text{m}}}{\text{BuyVolume}_{15\text{m}} + \text{SellVolume}_{15\text{m}}}$$

$$S_{\text{ofi}} = \frac{\text{OFI} + 1.0}{2.0} \quad \in [0.0, 1.0]$$

- **Interpretation:** Pure aggressive buying yields $S_{\text{ofi}} = 1.0$; balanced flow yields $0.50$; pure sell dumping yields $0.0$.

---

### Signal 6: Market Structure & Breakout Quality ($S_{\text{struct}}$)
Evaluates Higher-High/Higher-Low structure on 5m candles relative to the 24h range:

$$S_{\text{struct}} = 0.5 \cdot \mathbb{I}(\text{Close} > \text{24h High}_{\text{prev}}) + 0.5 \cdot \left(\frac{\text{Close} - \text{Low}_{24\text{h}}}{\text{High}_{24\text{h}} - \text{Low}_{24\text{h}}}\right)$$

---

### Signal 7: Volatility Quality Factor ($S_{\text{vol\_qual}}$)
Penalizes erratic discontinuous tick gaps while rewarding smooth, continuous trend volatility:

$$\text{Efficiency Ratio (ER)} = \frac{|P_t - P_{t-n}|}{\sum_{i=1}^n |P_i - P_{i-1}|}$$

$$S_{\text{vol\_qual}} = \text{ER} \quad \in [0.0, 1.0]$$

---

### Signal 8: Wallet Concentration & Holder Distribution ($S_{\text{holder}}$)
Measures top-10 non-AMM holder concentration using the Herfindahl-Hirschman Index ($\text{HHI}$):

$$S_{\text{holder}} = 1.0 - \min\left(1.0, \; \frac{\text{Top10HolderSupplyPct}}{50\%}\right)$$

- **Interpretation:** If top 10 holders own $>50\%$ of supply, score drops to $0.0$ (High Whale Dumping Risk).

---

### Signal 9: Token Risk Invariant ($S_{\text{risk}}$)
A binary/discrete safety gate checking onchain token metadata:

$$S_{\text{risk}} = \mathbb{I}(\text{MintAuthRevoked}) \cdot \mathbb{I}(\text{FreezeAuthDisabled}) \cdot \mathbb{I}(\text{LPLocked}\ge 90\%)$$

- **Interpretation:** Evaluates to `1.0` if clean; if any condition fails, $S_{\text{risk}} = 0.0$ which collapses the composite score and rejects the trade.

---

### Signal 10: Social Momentum (Reserved for Post-MVP)
- **Weight in MVP:** `0.0%` (Fixed placeholder).
- **Future Mechanism:** Aggregated sentiment score from X/Twitter and Telegram developer activity.
