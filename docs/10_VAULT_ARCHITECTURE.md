# NEXORA — Solana Onchain Vault & Delegated Policy Architecture

> **Document Version:** 1.0.0  
> **Status:** Approved Onchain Specification & Devnet Prototype  
> **Target Track:** Solana Hackathon — AI & DeFi Infrastructure  
> **Document Identifier:** NEX-VAULT-V1  
> **Core Doctrine:** **THE AI AGENT NEVER HAS UNRESTRICTED WALLET ACCESS. ALL ONCHAIN TRADES ARE ENFORCED BY SMART CONTRACT POLICY LIMITS.**

---

## 1. Executive Summary & Problem Definition

In traditional crypto bots, users hand over raw private keys or full wallet signing permissions to automated scripts. If the agent malfunctions, encounters an adversarial market manipulation (e.g. sandwich attack or pool drain), or hallucinates, the entire wallet balance can be liquidated or drained.

**NEXORA eliminates unrestricted private key access through an onchain Delegated Policy Vault (`programs/vault`):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NEXORA DELEGATED POLICY VAULT TOPOLOGY                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                 User / Owner                                │
│                     (Sole authority for withdrawals & policy)               │
│                                      │                                      │
│                                      ▼                                      │
│                           Non-Custodial Vault PDA                           │
│                         ┌─────────────────────────┐                         │
│                         │   Vault Policy Limits   │                         │
│                         │ • Max Single Trade: $50 │                         │
│                         │ • Max Daily Limit: $250 │                         │
│                         │ • Max Slippage: 50 bps  │                         │
│                         │ • Status: ACTIVE        │                         │
│                         └────────────┬────────────┘                         │
│                                      │                                      │
│               ┌──────────────────────┴──────────────────────┐               │
│               │                                             │               │
│               ▼                                             ▼               │
│     Autonomous AI Agent                           Emergency Stop            │
│  (Can ONLY execute approved swaps)             (Instant 1-Click Revoke)     │
│               │                                             │               │
│               ▼                                             ▼               │
│     Atomic DEX Swap (CPI)                            Vault Frozen           │
│   (Jupiter v6 / Meteora DLMM)                     (Trades Halted on Chain)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Account Structure & Memory Layout

The vault is governed by a Program Derived Address (PDA) deterministically derived from the owner's public key and the token mint.

### Account Schema: `VaultAccount`

```rust
#[account]
pub struct VaultAccount {
    pub owner: Pubkey,          // 32 bytes: Primary user authority
    pub agent: Pubkey,          // 32 bytes: Delegated agent public key
    pub token_mint: Pubkey,     // 32 bytes: Vault quote currency (e.g. USDC)
    pub vault_bump: u8,         // 1 byte: PDA bump seed for vault state
    pub token_bump: u8,         // 1 byte: PDA bump seed for vault token account
    pub policy: VaultPolicy,    // 19 bytes: Policy limits struct
    pub daily_spent: u64,       // 8 bytes: Rolling 24h cumulative spent (in micro-units)
    pub last_reset_slot: u64,   // 8 bytes: Slot height of last 24h window reset
    pub total_deposited: u64,   // 8 bytes: Lifetime total deposited
    pub total_withdrawn: u64,   // 8 bytes: Lifetime total withdrawn
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct VaultPolicy {
    pub max_single_trade: u64,  // 8 bytes: Maximum capital per single transaction
    pub max_daily_limit: u64,   // 8 bytes: Maximum capital per rolling 24h (216,000 slots)
    pub max_slippage_bps: u16,  // 2 bytes: Hard slippage cap (e.g. 50 = 0.50%)
    pub is_active: bool,        // 1 byte: Master operational switch (false = paused)
}
```

**Total Account Size:** `8 (Discriminator) + 32 + 32 + 32 + 1 + 1 + 19 + 8 + 8 + 8 + 8 = 157 bytes`.

---

## 3. Instruction Matrix & Permission Taxonomy

| Instruction | Signer(s) | Description | Invariants Enforced |
|---|---|---|---|
| **`initialize_vault`** | `owner` (Signer) | Creates vault PDA and initializes policy parameters. | PDA seeds `[b"vault", owner, mint]`. `max_single_trade <= max_daily_limit`. |
| **`deposit`** | `depositor` (Signer) | Transfers quote tokens from depositor to vault token PDA. | `amount > 0`. |
| **`withdraw`** | `owner` (Signer ONLY) | Withdraws quote tokens from vault back to owner. | `signer == vault.owner`. Agent CANNOT withdraw funds. |
| **`execute_trade`** | `agent_signer` (Signer) | Executes policy-checked swap to Jupiter / Meteora. | `signer == vault.agent`, `is_active == true`, `amount <= max_single_trade`, `daily_spent + amount <= max_daily_limit`. |
| **`emergency_pause`** | `owner` OR `agent` | Instantly sets `is_active = false`, halting all trades. | Either `owner` or `agent` can trigger immediately. |
| **`unpause`** | `owner` (Signer ONLY) | Restores `is_active = true`. | `signer == vault.owner`. Agent cannot unpause itself. |
| **`update_policy`** | `owner` (Signer ONLY) | Updates limits or rotates delegated agent public key. | `signer == vault.owner`. |

---

## 4. Authorities & Trust Boundaries

```
┌───────────────────────────────────────┬───────────────────┬───────────────────┐
│ ACTION                                │ OWNER AUTHORITY   │ AGENT AUTHORITY   │
├───────────────────────────────────────┼───────────────────┼───────────────────┤
│ Deposit Funds                         │ Allowed           │ Allowed           │
│ Withdraw Funds                        │ Allowed (Sole)    │ DENIED (Forbidden)│
│ Execute Bounded Swap                  │ Allowed           │ Allowed (Bounded) │
│ Execute Unbounded Swap                │ DENIED            │ DENIED (Forbidden)│
│ Emergency Pause (Kill Switch)         │ Allowed           │ Allowed           │
│ Resume / Unpause                      │ Allowed (Sole)    │ DENIED (Forbidden)│
│ Rotate Agent Keypair                  │ Allowed (Sole)    │ DENIED (Forbidden)│
│ Adjust Sizing & Risk Limits           │ Allowed (Sole)    │ DENIED (Forbidden)│
└───────────────────────────────────────┴───────────────────┴───────────────────┘
```

---

## 5. Constraints & Mathematical Invariants

1. **Max Single Trade Bound:**
   $$\text{amount\_in} \le \text{vault.policy.max\_single\_trade}$$
2. **Cumulative Daily Sizing Ceiling:**
   $$\text{vault.daily\_spent} + \text{amount\_in} \le \text{vault.policy.max\_daily\_limit}$$
3. **Rolling Window Slot Reset:**
   If $\text{clock.slot} - \text{vault.last\_reset\_slot} \ge 216,000 \text{ slots}$ (~24 hours), $\text{daily\_spent}$ resets to $0$.
4. **Non-Custodial Invariant:**
   The `vault_token_account` PDA authority only signs CPI transfers for:
   - Withdrawals to `vault.owner`
   - DEX swaps where received tokens remain locked inside the vault or are swapped back to quote currency.

---

## 6. Failure Cases & Error Taxonomy

| Error Code | Error Message | Trigger Condition |
|---|---|---|
| `UnauthorizedOwner` | `"Caller is not the authorized vault owner."` | Agent or unauthorized third party attempts to withdraw or update policy. |
| `UnauthorizedAgent` | `"Caller is not the authorized autonomous agent."` | Non-approved keypair attempts `execute_trade`. |
| `VaultPaused` | `"The vault is currently emergency paused by policy."` | Trade attempted while `policy.is_active == false`. |
| `SingleTradeLimitExceeded` | `"Trade size exceeds max single trade policy limit."` | Trade requested size $> \text{max\_single\_trade}$. |
| `DailyLimitExceeded` | `"Trade would exceed the 24-hour spending limit."` | Cumulative 24h allocation exceeds daily ceiling. |
| `InsufficientVaultBalance` | `"Trade size exceeds current vault balance."` | Trade requested size exceeds available token balance. |

---

## 7. Emergency Behavior & Kill-Switch Flow

When an anomaly, network congestion, or flash crash is detected:
1. **Trigger:** The operator clicks the Emergency Kill-Switch on the UI, or the agent risk engine triggers panic.
2. **Onchain Pause:** An `emergency_pause` transaction is signed and broadcast.
3. **Immutability:** Once `policy.is_active = false`, **all subsequent `execute_trade` calls revert onchain**.
4. **Recovery:** Only the owner's master wallet can call `unpause` or `withdraw` the remaining capital.
