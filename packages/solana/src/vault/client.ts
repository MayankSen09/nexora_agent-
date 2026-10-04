import { VaultAccount, VaultError, VaultPolicy } from "./types.js";

export class VaultClient {
  private vault?: VaultAccount;
  private currentSlot: bigint = 312850000n;

  public setSlot(slot: bigint): void {
    this.currentSlot = slot;
  }

  public advanceSlots(slots: bigint): void {
    this.currentSlot += slots;
  }

  /**
   * Initializes a non-custodial delegated policy vault
   */
  public async initializeVault(
    owner: string,
    agent: string,
    tokenMint: string,
    policy: VaultPolicy
  ): Promise<VaultAccount> {
    const vaultAddress = `vault_pda_${owner.substring(0, 6)}_${tokenMint.substring(0, 6)}`;
    const vaultTokenAddress = `vault_token_pda_${tokenMint.substring(0, 6)}`;

    this.vault = {
      vaultAddress,
      vaultTokenAddress,
      owner,
      agent,
      tokenMint,
      vaultBump: 255,
      tokenBump: 254,
      policy: { ...policy },
      dailySpent: 0n,
      lastResetSlot: this.currentSlot,
      totalDeposited: 0n,
      totalWithdrawn: 0n,
      balance: 0n,
    };

    return { ...this.vault };
  }

  public getVaultAccount(): VaultAccount | undefined {
    return this.vault ? { ...this.vault, policy: { ...this.vault.policy } } : undefined;
  }

  /**
   * Deposits funds into the Vault Token PDA
   */
  public async deposit(depositor: string, amount: bigint): Promise<void> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }
    if (amount <= 0n) {
      throw new VaultError("ZeroAmount", "Deposit amount must be greater than zero.");
    }

    this.vault.balance += amount;
    this.vault.totalDeposited += amount;
  }

  /**
   * Withdraws funds from Vault (OWNER ONLY)
   */
  public async withdraw(owner: string, amount: bigint): Promise<void> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }
    if (owner !== this.vault.owner) {
      throw new VaultError("UnauthorizedOwner", "Caller is not the authorized vault owner.");
    }
    if (amount <= 0n) {
      throw new VaultError("ZeroAmount", "Withdrawal amount must be greater than zero.");
    }
    if (amount > this.vault.balance) {
      throw new VaultError("InsufficientVaultBalance", "Withdrawal amount exceeds vault balance.");
    }

    this.vault.balance -= amount;
    this.vault.totalWithdrawn += amount;
  }

  /**
   * Executes a policy-bounded trade (AUTHORIZED AGENT ONLY)
   */
  public async executeTrade(
    agentSigner: string,
    amountIn: bigint,
    minAmountOut: bigint,
    dexProgramId: string
  ): Promise<{ amountIn: bigint; minAmountOut: bigint; dailySpentAfter: bigint }> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }

    // 1. Authenticate caller is designated agent
    if (agentSigner !== this.vault.agent) {
      throw new VaultError("UnauthorizedAgent", "Caller is not the authorized autonomous agent.");
    }

    // 2. Enforce active status
    if (!this.vault.policy.isActive) {
      throw new VaultError("VaultPaused", "The vault is currently emergency paused by policy.");
    }

    // 3. Daily reset rolling window check (~216,000 slots per 24h)
    const SLOTS_PER_DAY = 216000n;
    if (this.currentSlot - this.vault.lastResetSlot >= SLOTS_PER_DAY) {
      this.vault.dailySpent = 0n;
      this.vault.lastResetSlot = this.currentSlot;
    }

    // 4. Policy Invariant 1: Max Single Trade Limit
    if (amountIn > this.vault.policy.maxSingleTrade) {
      throw new VaultError(
        "SingleTradeLimitExceeded",
        `Trade size (${amountIn}) exceeds max single trade policy limit (${this.vault.policy.maxSingleTrade}).`
      );
    }

    // 5. Policy Invariant 2: Max 24-Hour Daily Limit
    const newDailySpent = this.vault.dailySpent + amountIn;
    if (newDailySpent > this.vault.policy.maxDailyLimit) {
      throw new VaultError(
        "DailyLimitExceeded",
        `Trade would exceed 24h cumulative spending limit (${this.vault.policy.maxDailyLimit}). Cumulative spent would be ${newDailySpent}.`
      );
    }

    // 6. Balance verification
    if (amountIn > this.vault.balance) {
      throw new VaultError("InsufficientVaultBalance", "Trade size exceeds current vault balance.");
    }

    // 7. Update state
    this.vault.balance -= amountIn;
    this.vault.dailySpent = newDailySpent;

    return {
      amountIn,
      minAmountOut,
      dailySpentAfter: this.vault.dailySpent,
    };
  }

  /**
   * Emergency Pause (OWNER or AGENT can trigger instantly)
   */
  public async emergencyPause(signer: string): Promise<void> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }
    if (signer !== this.vault.owner && signer !== this.vault.agent) {
      throw new VaultError("UnauthorizedSigner", "Signer is neither owner nor authorized agent.");
    }

    this.vault.policy.isActive = false;
  }

  /**
   * Unpause Vault (OWNER ONLY)
   */
  public async unpause(owner: string): Promise<void> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }
    if (owner !== this.vault.owner) {
      throw new VaultError("UnauthorizedOwner", "Only the vault owner can unpause the vault.");
    }

    this.vault.policy.isActive = true;
  }

  /**
   * Update Policy Limits (OWNER ONLY)
   */
  public async updatePolicy(owner: string, newPolicy: VaultPolicy): Promise<void> {
    if (!this.vault) {
      throw new VaultError("UnauthorizedSigner", "Vault is not initialized.");
    }
    if (owner !== this.vault.owner) {
      throw new VaultError("UnauthorizedOwner", "Only the vault owner can update policy limits.");
    }

    this.vault.policy = { ...newPolicy };
  }
}
