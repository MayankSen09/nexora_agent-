# Skill Usage & Architectural Design Guide

> **Project:** Solana Hackathon — Quantitative Trading & DeFi Protocol Interface  
> **Status:** Active Reference & Standard Operating Procedure  
> **Role:** Lead Architect & Principal Product Engineer  

---

## 1. Executive Summary & Design Direction

This document defines the architectural mandate, skill distribution, and implementation standards for this project.

### Core Aesthetic & UX Directive
- **NOT a Generic SaaS UI:** We strictly reject generic startup SaaS templates, floating rounded cards, arbitrary floating gradients, rainbow neon borders, and excessive decorative glassmorphism.
- **Institutional / Quantitative Trading Standard:** The product must look and feel like a high-performance financial workstation (in the vein of Bloomberg Terminal, Linear, TradingView, Raydium Pro, and Paradigm).
- **Key Characteristics:**
  - High information density with optical grouping over nested cards/containers.
  - Tabular numeric alignment (`tabular-nums`, monospaced figures for financial values, prices, tick sizes, and execution volumes).
  - Restrained, high-contrast dark palette with functional, non-decorative semantic status indicators (Execution Green `#00C087` / Sell Crimson `#FF4D4D` / Protocol Accent).
  - Instant micro-interactions (80–150ms visual feedback) with zero blocking entrance choreography.

---

## 2. Skill Relevance Matrix

| Skill | Relevance | Primary Role in Project | Usage Policy |
|---|---|---|---|
| **`ui-taste`** | **CRITICAL** | Core craft floor, anti-UI-slop enforcement, layout hierarchy, and finish inspection. | **Always Active** |
| **`ui-ux-pro-max`** | **CRITICAL** | Design intelligence, quantitative & fintech palettes, typography pairing, chart patterns, and UX edge cases. | **Always Active** |
| **`ui-styling`** | **CRITICAL** | Component styling architecture (Tailwind CSS + shadcn/Radix primitives), dark mode variables, and layout utilities. | **Always Active** |
| **`design-system`** | **CRITICAL** | Three-layer token architecture (Primitive → Semantic → Component) and CSS custom property management. | **Always Active** |
| **`brand`** | **HIGH** | Visual identity standards, institutional tone of voice, copy frameworks, and asset governance. | **Active for Brand & Assets** |
| **`slides`** | **HIGH** | Hackathon demo deck, investor presentations, and judge evaluation pitch generation with live Chart.js figures. | **Active for Presentations** |
| **`banner-design`** | **MEDIUM** | Social share previews, hackathon hero graphics, and OpenGraph/marketing banners. | **Active for Marketing/Social** |
| **`design`** | **MEDIUM** | SVG icon generation, protocol mark design, and CIP deliverable structuring. | **Active as Meta-Router** |
| **`ios-design`** | **RESTRICTED** | iPhone/iOS patterns (SwiftUI/React Native). | **Restricted / On-Demand Only** |
| **`find-skills`** | **UTILITY** | Discovery of ecosystem skills if specialized capabilities are needed. | **Utility Only** |

---

## 3. Functional Skill Mapping

When architecting and implementing specific areas of the application, follow this routing matrix:

```
                                  [ PROJECT TASK ]
                                         │
        ┌───────────────────┬────────────┴─────────────┬────────────────────┐
        ▼                   ▼                          ▼                    ▼
   [ Product UI ]    [ Design System ]         [ Data & Charts ]    [ Presentation ]
        │                   │                          │                    │
  • ui-taste          • design-system            • ui-ux-pro-max       • slides
  • ui-styling        • ui-styling (tokens)      • design-system       • brand
  • ui-ux-pro-max     • brand (palettes)         • Chart.js / canvas   • Chart.js
```

### 1. Product & Core Trading UI
* **Primary Skills:** `ui-taste` (`operate.md`, `craft.md`) + `ui-styling`
* **Focus:** Trading forms, order entry (Limit, Market, Stop-Loss), token swap panels, position lists, orderbooks, and liquidity pool management.
* **Rules:** Standard predictable controls, single keyboard-accessible vocabulary, dense tabular data, visible focus rings, and explicit transaction state transitions (signing, broadcast, confirmation, error recovery).

### 2. Dashboard UI
* **Primary Skills:** `ui-taste` (`operate.md`) + `ui-ux-pro-max` (`--domain ux`)
* **Focus:** Portfolio breakdown, real-time PnL metrics, transaction history, liquidity utilization, and APY/volume monitors.
* **Rules:** Avoid repetitive icon-title card layouts. Group by whitespace and subtle 1px dividers rather than heavily boxed cards. Align all metrics with clear visual hierarchy.

### 3. Design System & Tokens
* **Primary Skills:** `design-system` + `ui-styling` (`references/tailwind-customization.md`)
* **Focus:** Establishing the single source of truth (`design-tokens.json` & `design-tokens.css`).
* **Rules:** Enforce the 3-layer token pipeline:
  ```
  Primitive Tokens  (e.g., --slate-900: #0B0E14, --emerald-500: #00C087)
         ↓
  Semantic Tokens   (e.g., --bg-surface: var(--slate-900), --color-buy: var(--emerald-500))
         ↓
  Component Tokens  (e.g., --orderbook-bid-bg: var(--color-buy))
  ```

### 4. Branding & Visual Identity
* **Primary Skills:** `brand` + `design`
* **Focus:** Institutional quantitative tone, typography scale (e.g. JetBrains Mono / Inter / Plus Jakarta Sans), mark/logo geometry, and clean documentation.
* **Rules:** High precision, concise trading terminology, absence of sensationalist crypto hype.

### 5. Charts & Quantitative Visualizations
* **Primary Skills:** `ui-ux-pro-max` (`--domain chart`) + `design-system`
* **Focus:** Price candlestick charts, depth charts (Bids vs. Asks), historical yield curves, volume distribution bars.
* **Rules:** Tabular figures on tooltips, high-contrast grid lines (subtle alpha), clear timescale toggles (1m, 5m, 1h, 1D), zero lag on data point scrubbing.

### 6. Responsive Design
* **Primary Skills:** `ui-styling` (`tailwind-responsive.md`) + `ui-taste` (`craft.md`)
* **Focus:** Multi-breakpoint trading workspace (desktop multi-panel terminal down to compact mobile execution).
* **Rules:** Structural collapse (reflow panels into tabs/drawers) rather than shrinking fonts or hiding critical trade parameters.

### 7. Micro-Interactions & Motion
* **Primary Skills:** `ui-taste` (`craft.md`) + `ui-ux-pro-max` (`--domain gsap`)
* **Focus:** Order fill flashes, price tick animations, copy-to-clipboard confirmations, modal drawer transitions.
* **Rules:** Micro-interactions must execute within 80–150ms. Never block trading actions behind page load animations. Full support for `prefers-reduced-motion`.

### 8. Accessibility (a11y)
* **Primary Skills:** `ui-ux-pro-max` (`references/` a11y outcome queries) + `ui-styling` (`shadcn-accessibility.md`)
* **Focus:** Keyboard trade execution, screen-reader transaction alerts, color-blind friendly trade indicators.
* **Rules:** Minimum contrast ratio 4.5:1 for standard text; color must never be the sole indicator of profit/loss (pair with `+`/`-` or directional icons); all modals trap focus cleanly.

### 9. Landing Page & Product Overview
* **Primary Skills:** `ui-ux-pro-max` (`--domain landing`) + `banner-design`
* **Focus:** Hackathon submission showcase, protocol value proposition, protocol architecture diagram, live stats banner.
* **Rules:** Value-first hero, live verifiable metric previews, clear primary CTA ("Launch Terminal" / "Connect Wallet").

### 10. Presentation & Demo Deck Assets
* **Primary Skills:** `slides` + `design-system`
* **Focus:** HTML/Chart.js presentation deck for hackathon judges and pitch walkthroughs.
* **Rules:** Strategic Duarte sparkline emotional arc (Problem → Solution → Market Validation → Tech Innovation), token compliance (`assets/design-tokens.css`), interactive Chart.js widgets.

---

## 4. Mandatory Skill Principles & Implementation Directives

### A. Principles from `ui-taste` (Anti-UI-Slop)
1. **Eliminate Habitual AI Tropes:**
   - No arbitrary nested cards within cards.
   - No decorative glassmorphism backgrounds that reduce contrast.
   - No glowing neon outline animations around every button.
   - No emoji icons in system controls or headers.
2. **Density and Purpose:**
   - Match information density to the task. Financial users require dense, scan-friendly grids.
   - Spacing and subtle 1px borders (`border-border/40`) must define structure before backgrounds are added.
3. **Verified Interaction States:**
   - Every interactive element must have explicit `:hover`, `:active`, `:focus-visible`, `:disabled`, and loading states.
   - Never shift layout geometry on hover or press.

### B. Principles from `ui-ux-pro-max`
1. **Icon Discipline:**
   - Use vector icon libraries only (**Phosphor Icons** `@phosphor-icons/react` or **Lucide Icons**).
   - Icons must be optically aligned and follow a uniform stroke width (1.5px or 2px).
   - Decorative icons must use `aria-hidden="true"`.
2. **Typography & Tabular Numerals:**
   - High-precision numerical displays must enforce `font-feature-settings: "tnum"` / `font-mono`.
   - Clear contrast ratio ≥ 4.5:1 across both dark and light modes.
3. **Predictable Navigation & Form Design:**
   - Inline real-time validation for slippage, gas estimate, and balance limits.
   - Immediate feedback when transactions are pending or signed.

### C. Principles from `ui-styling` & `design-system`
1. **Zero Hardcoded Hex Codes in Application Code:**
   - All components must reference semantic CSS variables or Tailwind tokens (`bg-background`, `text-foreground`, `border-border`, `bg-trade-buy`).
2. **Radix Primitives for Complex UI:**
   - Use headless, fully accessible primitives for Dialogs, Dropdowns, Popovers, Tabs, Tooltips, and Command Menus.
3. **Mobile-First Breakpoint Architecture:**
   - Mobile styles first, followed by `md:`, `lg:`, `xl:`, and `2xl:` workspace grid enhancements.

---

## 5. Skills Restricted or Prohibited from Routine Use

| Skill | Restriction Level | Rationale |
|---|---|---|
| **`ios-design`** | **RESTRICTED** | This project is a Web3/Solana web terminal. iOS-specific conventions (e.g. Dynamic Type scaling, iOS navigation sheets, UIKit safe-area insets) must NOT be applied to the desktop web trading terminal unless an explicit native iOS React Native/SwiftUI companion is requested. |
| **`find-skills`** | **STANDBY ONLY** | Do not execute search loops. All required skills for design, brand, UI, styling, and charts are already locally installed. |
| **Cyberpunk/Glow Generators** (Sub-styles in `banner-design`) | **PROHIBITED FOR APP UI** | Flashy neon/cyberpunk aesthetics are strictly confined to marketing banners if requested, and must NEVER bleed into the clean quantitative trading terminal UI. |

---

## 6. Pre-Implementation Quality Checklist

Before shipping any component or page:
- [ ] **No UI Slop:** No arbitrary rainbow gradients, heavy drop shadows, or unreadable glassmorphism.
- [ ] **Information Density:** Clean layout with monospaced tabular numbers for financial figures.
- [ ] **Accessibility:** Keyboard navigable (`tabIndex`, `:focus-visible`), aria labels on icon buttons, contrast ≥ 4.5:1.
- [ ] **Design Tokens:** Zero raw hex colors in JSX/TSX; all colors derive from CSS variables.
- [ ] **Performance:** Zero layout jank, sub-100ms interaction response, responsive from mobile (375px) to 4K ultra-wide.
