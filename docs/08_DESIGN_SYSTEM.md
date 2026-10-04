# NEXORA — Visual Identity & Design System Specification

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline Design System  
> **Target Track:** Solana Hackathon — AI & DeFi Infrastructure  
> **Document Identifier:** NEX-DESIGN-V1  
> **Design Philosophy:** **INSTITUTIONAL QUANTITATIVE PRECISION & ZERO-SLOP DISCIPLINE.**  

---

## 1. Brand Identity & Personality

### 1.1 Brand Essence
**NEXORA** is autonomous intelligence for high-frequency onchain capital allocation. It operates at the intersection of quantitative hedge-fund discipline and real-time Solana DeFi execution.

### 1.2 Personality Matrix
- **Institutional & Sovereign:** Authoritative, disciplined, verifiable. Never hype-driven or speculative.
- **High-Density & Analytical:** Respects the user's screen real estate; prioritizes tabular metrics and orderbook depth over decorative fluff.
- **Restrained & Precise:** Uses deep monochromatic surfaces (`#0B0E14`, `#111620`) accented strictly with functional trading indicators (Execution Emerald `#00C087`, Sell Crimson `#FF4D4D`, Precision Cyan `#00B4D8`).
- **Anti-AI Slop:** Zero purple gradients, zero excessive glassmorphism blur, zero floating pill cards, and zero emojis in UI controls.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BRAND VOICE & TONE PROFILE                         │
├───────────────────────┬───────────────────────────┬─────────────────────────┤
│ WHAT WE ARE           │ WHAT WE AVOID             │ BENCHMARK INSPIRATION   │
├───────────────────────┼───────────────────────────┼─────────────────────────┤
│ • Quantitative        │ • "Crypto Degens"         │ • Bloomberg Terminal    │
│ • Deterministic       │ • "ChatGPT Trading Bot"   │ • Linear.app            │
│ • High Density        │ • "Neon Rainbow SaaS"     │ • TradingView Pro       │
│ • Mathematically Safe │ • "Floating Card Bloat"   │ • Paradigm / Jane Street│
└───────────────────────┴───────────────────────────┴─────────────────────────┘
```

---

## 2. Core Visual Principles

1. **Optical Grouping Over Nested Boxes:** Use subtle 1px dividers (`hsl(var(--border) / 0.4)`) and intentional spacing rather than nested cards inside cards.
2. **Tabular Numerical Precision:** All financial metrics, prices, PnL, volumes, and tick feeds must enforce `font-variant-numeric: tabular-nums` and use monospaced fonts for exact column alignment.
3. **Sub-150ms Responsive Feedback:** Micro-interactions (hover, focus, price flashes) must resolve in 80–150ms. Never block trading interaction behind entrance animations.
4. **Functional Color Discipline:** Color carries strict semantic meaning (Buy/Profit vs. Sell/Loss vs. Warning). Color is never used for purely decorative backgrounds.

---

## 3. Three-Layer Token Architecture (CSS Custom Properties)

```
Primitive Tokens (Raw HSL values)
       ↓
Semantic Tokens (Purpose aliases for theme & state)
       ↓
Component Tokens (Element-specific bindings)
```

### 3.1 Primitive Tokens (`:root`)
```css
:root {
  /* Monochromes - Deep Slate Core */
  --slate-950: 222 47% 4%;    /* #05070B - Canvas Background */
  --slate-900: 222 47% 7%;    /* #0B0E14 - Base Surface */
  --slate-850: 222 40% 10%;   /* #101520 - Raised Surface / Card */
  --slate-800: 222 35% 14%;   /* #171E2C - Overlay / Dropdown */
  --slate-700: 222 25% 22%;   /* #2A3448 - Subtle Border */
  --slate-600: 222 18% 36%;   /* #4B5A75 - Divider / Inactive */
  --slate-400: 222 14% 65%;   /* #96A2B8 - Secondary Muted Text */
  --slate-200: 222 20% 88%;   /* #DCDEE5 - Primary Text */
  --slate-50:  0 0% 100%;     /* #FFFFFF - Bright Highlights */

  /* Semantic Trading Accents */
  --emerald-500: 162 100% 38%; /* #00C087 - Execution Buy / Profit */
  --emerald-600: 162 100% 28%; /* #008F64 - Buy Hover / Dark */
  --emerald-950: 162 90% 8%;   /* #022016 - Buy Background Tint */

  --crimson-500: 354 100% 65%; /* #FF4D64 - Sell / Stop Loss */
  --crimson-600: 354 100% 50%; /* #FF0026 - Sell Hover */
  --crimson-950: 354 90% 9%;   /* #250308 - Sell Background Tint */

  --cyan-500:    192 100% 42%; /* #00B4D8 - Protocol Brand Accent */
  --cyan-950:    192 90% 8%;   /* #011C23 - Brand Background Tint */

  --amber-500:   38 92% 50%;   /* #F59E0B - Warning / Watch Status */
  --amber-950:   38 90% 8%;    /* #241602 - Warning Background Tint */
}
```

### 3.2 Semantic System Tokens
```css
:root {
  --background: var(--slate-950);
  --foreground: var(--slate-200);

  --surface-base:    var(--slate-900);
  --surface-raised:  var(--slate-850);
  --surface-overlay: var(--slate-800);
  --surface-inset:   var(--slate-950);

  --border-subtle:   var(--slate-700);
  --border-muted:    hsl(var(--slate-700) / 0.4);
  --border-strong:   var(--slate-600);

  --trade-buy:       var(--emerald-500);
  --trade-buy-bg:    var(--emerald-950);
  --trade-sell:      var(--crimson-500);
  --trade-sell-bg:   var(--crimson-950);

  --status-watch:    var(--amber-500);
  --status-watch-bg: var(--amber-950);
  --status-info:     var(--cyan-500);
  --status-info-bg:  var(--cyan-950);

  --text-primary:    var(--slate-50);
  --text-secondary:  var(--slate-400);
  --text-muted:      var(--slate-600);
}
```

---

## 4. Typography Scale & Numerical Treatment

### 4.1 Font Families
- **Display & Interface Headings:** `Plus Jakarta Sans` or `Inter`, sans-serif.
- **Data, Code & Trading Figures:** `JetBrains Mono` or `Roboto Mono`, monospace.

### 4.2 Type Scale (Compact High-Density Scale)
| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-2xs` | 10px / 0.625rem | 14px | 500 / 600 | Badges, tick micro-labels, table subtext |
| `text-xs` | 11px / 0.6875rem | 16px | 400 / 500 | Table headers, secondary metrics, fees |
| `text-sm` | 13px / 0.8125rem | 18px | 400 / 500 | Standard UI text, input fields, order form |
| `text-base` | 14px / 0.875rem | 20px | 500 / 600 | Card titles, primary metrics, buttons |
| `text-lg` | 16px / 1.0rem | 24px | 600 | Panel headers, aggregate PnL display |
| `text-xl` | 20px / 1.25rem | 28px | 700 | Primary Portfolio Valuation, Key Metric |
| `text-2xl` | 24px / 1.5rem | 32px | 700 | Terminal Master Header |

### 4.3 Tabular Figures Rule
```css
/* Mandatory for all numerical metrics */
.tabular-nums {
  font-variant-numeric: tabular-nums lining-nums;
  font-family: var(--font-mono);
  letter-spacing: -0.01em;
}
```

---

## 5. Spacing, Radii, Borders & Shadows

### 5.1 Spacing Rhythm (4px / 8px Base Scale)
- `space-1`: `4px` — Micro gap between icon and text.
- `space-2`: `8px` — Inner button padding, compact table cell padding.
- `space-3`: `12px` — Standard component gap.
- `space-4`: `16px` — Card inner padding, section spacing.
- `space-6`: `24px` — Major panel separation.
- `space-8`: `32px` — Page container padding.

### 5.2 Radius Scale (Restrained & Subtle)
- `rounded-none`: `0px` — Data tables, grid cell bounds.
- `rounded-xs`: `2px` — Micro-badges, chart tooltip tags.
- `rounded-sm`: `4px` — Form inputs, buttons, dropdown items.
- `rounded-md`: `6px` — Standard panels, modal dialogs.
- `rounded-full`: `9999px` — Status pills, toggle switches.
*(Giant rounded 16px/24px cards are strictly prohibited).*

### 5.3 Elevation & Shadows (Crisp & Low-Blur)
- `--shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.40)`
- `--shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.60), 0 2px 4px -2px rgba(0, 0, 0, 0.40)`
- `--shadow-dropdown`: `0 10px 15px -3px rgba(0, 0, 0, 0.80), 0 0 0 1px hsl(var(--border-subtle))`

---

## 6. Component Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT SYSTEM OVERVIEW                           │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 1. Button System  │ 4. Orderbook Grids│ 7. Modals/Dialogs │ 10. Empty States│
│ 2. Input System   │ 5. Decision Ledger│ 8. Toasts/Alerts  │ 11. Tooltips    │
│ 3. Data Tables    │ 6. Candlestick UI │ 9. Status Badges  │ 12. Kill-Switch │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

### 6.1 Button System
- **`Primary (Action)`:** High-contrast solid Emerald/Cyan, `h-8 px-3 text-xs font-semibold rounded-sm`.
- **`Secondary (Outline)`:** Surface-raised with 1px border (`border-slate-700 hover:border-slate-500`).
- **`Trade Buy`:** Solid Emerald `#00C087`, white text, instant active opacity transition.
- **`Trade Sell`:** Solid Crimson `#FF4D64`, white text.
- **`Ghost / Icon`:** Transparent background, `text-slate-400 hover:text-white hover:bg-slate-800`.

### 6.2 Input & Form Controls
- **Style:** Inset background (`hsl(var(--surface-inset))`), 1px border (`hsl(var(--border-subtle))`).
- **Focus Ring:** Crisp 1px highlight (`outline-none ring-1 ring-cyan-500`).
- **Tabular Steppers:** Number inputs display monospaced values with dedicated `+` / `-` increment buttons.

### 6.3 Data Tables (Orderbook & Positions)
- **Header:** Sticky `h-7 text-2xs uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-700/60`.
- **Row:** `h-8 text-xs border-b border-slate-800/40 hover:bg-slate-850/60 transition-colors`.
- **Numbers:** Aligned right, monospaced tabular figures, colored green/red strictly for PnL deltas.

### 6.4 Decision Ledger Feed
- **Style:** Dense vertical timeline card list.
- **Header:** Timestamp (`HH:mm:ss.SSS`), Pair (`SOL/USDC`), Score Pill (`84/100`).
- **Body:** 2-sentence rationale, Signal Badges (`Volume +340%`, `Fee APR 48%`).
- **Footer:** Risk Verification Badge (`APPROVED` in green or `REJECTED: SLIPPAGE > 0.5%` in crimson).

### 6.5 Global Emergency Kill Switch Component
- **Placement:** Top right global navigation bar.
- **Style:** Distinct, border-highlighted pill button (`bg-crimson-950/80 border border-crimson-500 text-crimson-200 hover:bg-crimson-600 hover:text-white`).
- **Action:** Triggers instantaneous modal confirmation for Agent Pause vs. Full Panic Liquidation.

---

## 7. Data Visualization Palette

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA VIZ COLOR SPECIFICATION                           │
├──────────────────────────┬───────────────────┬──────────────────────────────┤
│ METRIC TYPE              │ COLOR VALUE       │ PURPOSE                      │
├──────────────────────────┼───────────────────┼──────────────────────────────┤
│ Candlestick Bullish (Up) │ #00C087           │ Price close >= open          │
│ Candlestick Bearish (Down│ #FF4D64           │ Price close < open           │
│ Orderbook Bid Depth      │ rgba(0,192,135,0.15) Cumulative buy volume fill  │
│ Orderbook Ask Depth      │ rgba(255,77,100,0.15)Cumulative sell volume fill │
│ Volume Bar (Bullish)     │ rgba(0,192,135,0.40) Up-volume bar              │
│ Volume Bar (Bearish)     │ rgba(255,77,100,0.40)Down-volume bar             │
│ Equity Curve Line        │ #00B4D8           │ Cumulative portfolio value   │
│ Grid Lines & Axes        │ rgba(75,90,117,0.20)Subtle background grid      │
└──────────────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 8. Accessibility & Responsiveness

### 8.1 Accessibility (WCAG 2.1 AA Compliant)
- **Contrast:** All primary text achieves $\ge 7:1$ contrast; secondary text achieves $\ge 4.5:1$ against surface backgrounds.
- **Non-Color Dependence:** Every trade outcome or status uses both color AND iconography (e.g. `▲ +4.2%` or `▼ -1.8%`).
- **Keyboard Traversal:** Complete keyboard shortcut navigation (`Escape` closes modals, `Space` toggles agent, `Ctrl+K` opens command palette).

### 8.2 Responsive Panel Architecture
- **Desktop (1440px+):** 3-column financial workstation (Left: Market Discovery & Watchlist, Center: Charts & Orderbook, Right: Decision Ledger & Active Positions).
- **Tablet / Laptop (1024px – 1439px):** 2-column layout with collapsible sidebar.
- **Mobile (< 1023px):** Single-column tabbed terminal with bottom navigation switcher (`Markets`, `Trade`, `Ledger`, `Portfolio`).
