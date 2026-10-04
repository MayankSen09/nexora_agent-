import { describe, test, expect, beforeEach } from "bun:test";
import { VaultClient, VaultPolicy } from "../vault/index.js";

describe("Solana Vault & Delegated Policy Architecture (@nexora/solana/vault)", () => {
  let client: VaultClient;
  const ownerPubkey = "OwnerMasterKey111111111111111111111111111111";
  const agentPubkey = "AgentDelegatedKey22222222222222222222222222";
  const attackerPubkey = "AttackerUnauthorizedKey3333333333333333333";
  const usdcMint = "USDC_DEVNET_MINT_4zMMC9srt5Ri5X14GAgXhaHii3G";

  const defaultPolicy: VaultPolicy = {
    maxSingleTrade: 50_000_000n, // $50.00 USDC (6 decimals)
    maxDailyLimit: 250_000_000n,  // $250.00 USDC
    maxSlippageBps: 50,           // 0.50%
    isActive: true,
  };

  beforeEach(async () => {
    client = new VaultClient();
    await client.initializeVault(ownerPubkey, agentPubkey, usdcMint, defaultPolicy);
  });

  describe("1. Vault Initialization & Deposits", () => {
    test("should initialize vault with correct owner, agent, and policy limits", () => {
      const vault = client.getVaultAccount();
      expect(vault).toBeDefined();
      expect(vault!.owner).toBe(ownerPubkey);
      expect(vault!.agent).toBe(agentPubkey);
      expect(vault!.tokenMint).toBe(usdcMint);
      expect(vault!.policy.maxSingleTrade).toBe(50_000_000n);
      expect(vault!.policy.maxDailyLimit).toBe(250_000_000n);
      expect(vault!.balance).toBe(0n);
    });

    test("should accept deposits and increment vault balance", async () => {
      await client.deposit(ownerPubkey, 1000_000_000n); // Deposit $1,000 USDC
      const vault = client.getVaultAccount();
      expect(vault!.balance).toBe(1000_000_000n);
      expect(vault!.totalDeposited).toBe(1000_000_000n);
    });
  });

  describe("2. Non-Custodial Withdrawals (Owner Authority Boundary)", () => {
    beforeEach(async () => {
      await client.deposit(ownerPubkey, 500_000_000n); // $500 USDC
    });

    test("Owner should be able to withdraw funds", async () => {
      await client.withdraw(ownerPubkey, 200_000_000n); // Withdraw $200
      const vault = client.getVaultAccount();
      expect(vault!.balance).toBe(300_000_000n);
      expect(vault!.totalWithdrawn).toBe(200_000_000n);
    });

    test("Agent MUST NOT be able to withdraw funds (Strict Non-Custodial Invariant)", async () => {
      expect(client.withdraw(agentPubkey, 50_000_000n)).rejects.toThrow("UnauthorizedOwner");
    });

    test("Unauthorized third party MUST NOT be able to withdraw funds", async () => {
      expect(client.withdraw(attackerPubkey, 100_000_000n)).rejects.toThrow("UnauthorizedOwner");
    });
  });

  describe("3. Policy-Bounded Agent Trading & Authorization Limits", () => {
    beforeEach(async () => {
      await client.deposit(ownerPubkey, 1000_000_000n); // $1,000 USDC in vault
    });

    test("Authorized agent should execute trade within single and daily policy limits", async () => {
      const result = await client.executeTrade(
        agentPubkey,
        40_000_000n, // $40 USDC (<= $50 limit)
        39_800_000n,
        "JUPITER_PROGRAM_ID"
      );

      expect(result.amountIn).toBe(40_000_000n);
      expect(result.dailySpentAfter).toBe(40_000_000n);

      const vault = client.getVaultAccount();
      expect(vault!.balance).toBe(960_000_000n);
      expect(vault!.dailySpent).toBe(40_000_000n);
    });

    test("Unauthorized signer MUST NOT be able to execute trades", async () => {
      expect(
        client.executeTrade(attackerPubkey, 20_000_000n, 19_900_000n, "JUPITER")
      ).rejects.toThrow("UnauthorizedAgent");
    });

    test("Trade MUST REVERT if amount exceeds maxSingleTrade policy limit", async () => {
      // Attempt $75 trade when limit is $50
      expect(
        client.executeTrade(agentPubkey, 75_000_000n, 74_000_000n, "JUPITER")
      ).rejects.toThrow("SingleTradeLimitExceeded");
    });

    test("Trade MUST REVERT if cumulative allocation exceeds maxDailyLimit", async () => {
      // Execute 5 trades of $50 = $250 (Max Daily Limit)
      for (let i = 0; i < 5; i++) {
        await client.executeTrade(agentPubkey, 50_000_000n, 49_500_000n, "JUPITER");
      }

      const vault = client.getVaultAccount();
      expect(vault!.dailySpent).toBe(250_000_000n);

      // 6th trade of $10 must breach $250 daily ceiling and revert
      expect(
        client.executeTrade(agentPubkey, 10_000_000n, 9_900_000n, "JUPITER")
      ).rejects.toThrow("DailyLimitExceeded");
    });

    test("Daily spent resets after 24h rolling window (216,000 slots elapsed)", async () => {
      // Spend full daily limit
      for (let i = 0; i < 5; i++) {
        await client.executeTrade(agentPubkey, 50_000_000n, 49_500_000n, "JUPITER");
      }

      // Advance clock by 216,001 slots (>24 hours)
      client.advanceSlots(216001n);

      // New trade should succeed as window reset to $0 spent
      const result = await client.executeTrade(agentPubkey, 30_000_000n, 29_700_000n, "JUPITER");
      expect(result.dailySpentAfter).toBe(30_000_000n);
    });
  });

  describe("4. Emergency Pause, Unpause & Policy Governance", () => {
    beforeEach(async () => {
      await client.deposit(ownerPubkey, 500_000_000n);
    });

    test("Both Owner and Agent can trigger emergencyPause to immediately freeze trading", async () => {
      await client.emergencyPause(agentPubkey);
      const vault = client.getVaultAccount();
      expect(vault!.policy.isActive).toBe(false);

      // Subsequent trade attempts must fail
      expect(
        client.executeTrade(agentPubkey, 25_000_000n, 24_800_000n, "JUPITER")
      ).rejects.toThrow("VaultPaused");
    });

    test("Agent MUST NOT be able to unpause the vault (Only Owner can resume)", async () => {
      await client.emergencyPause(ownerPubkey);

      // Agent attempting unpause fails
      expect(client.unpause(agentPubkey)).rejects.toThrow("UnauthorizedOwner");

      // Owner unpauses successfully
      await client.unpause(ownerPubkey);
      const vault = client.getVaultAccount();
      expect(vault!.policy.isActive).toBe(true);

      // Trading works again
      const trade = await client.executeTrade(agentPubkey, 20_000_000n, 19_900_000n, "JUPITER");
      expect(trade.amountIn).toBe(20_000_000n);
    });

    test("Owner can update policy parameters and adjust limits", async () => {
      const updatedPolicy: VaultPolicy = {
        maxSingleTrade: 100_000_000n, // Increase to $100
        maxDailyLimit: 500_000_000n,  // Increase to $500
        maxSlippageBps: 100,
        isActive: true,
      };

      await client.updatePolicy(ownerPubkey, updatedPolicy);
      const vault = client.getVaultAccount();
      expect(vault!.policy.maxSingleTrade).toBe(100_000_000n);

      // Agent can now execute $80 trade (was previously forbidden under $50 limit)
      const trade = await client.executeTrade(agentPubkey, 80_000_000n, 79_000_000n, "JUPITER");
      expect(trade.amountIn).toBe(80_000_000n);
    });
  });
});
