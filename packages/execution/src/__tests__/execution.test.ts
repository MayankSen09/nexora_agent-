import { describe, test, expect, beforeEach } from "bun:test";
import {
  JupiterExecutionProvider,
  MeteoraExecutionProvider,
  MockExecutionProvider,
  PaperExecutionProvider,
  ExecutionPipeline,
  TradeIntent,
} from "../index.js";
import { MockSigner } from "@nexora/solana";
import { db } from "@nexora/database";
import { CandidateMarket, PROTOCOL_CONSTANTS, RiskPolicyConfig } from "@nexora/shared";

describe("Execution Layer & Providers (@nexora/execution)", () => {
  const createTestIntent = (amountUsdc = 100.0, action: "BUY" | "SELL" = "BUY"): TradeIntent => ({
    id: `intent-${Date.now()}`,
    marketAddress: "Meteora_SOL_USDC_DLMM_8xKz",
    pairSymbol: "SOL/USDC",
    action,
    inputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
    outputMint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
    amountInUsdc: amountUsdc,
    amountInRaw: 1000000000n, // 1 SOL
    maxSlippageBps: 50,
    expectedPriceUsdc: 148.42,
    timestamp: new Date().toISOString(),
  });

  const createTestMarket = (): CandidateMarket => ({
    address: "Meteora_SOL_USDC_DLMM_8xKz",
    venue: "METEORA_DLMM",
    baseToken: {
      mint: PROTOCOL_CONSTANTS.QUOTE_MINTS.SOL_MINT,
      symbol: "SOL",
      name: "SOL",
      decimals: 9,
      isVerified: true,
    },
    quoteToken: {
      mint: PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET,
      symbol: "USDC",
      name: "USDC",
      decimals: 6,
      isVerified: true,
    },
    metrics: {
      priceUsdc: 148.42,
      priceNative: 1.0,
      volume24hUsdc: 5000000,
      volume15mUsdc: 200000,
      liquidityDepthUsdc: 600000,
      feeAprPct: 45.0,
      realizedVolatility1hPct: 2.2,
      orderFlowImbalance: 0.60,
      activeBinId: 24810,
      priceChange24hPct: 4.5,
      priceChange15mPct: 1.2,
    },
    opportunityScore: 88.0,
    isTradeable: true,
    securityStatus: {
      isMintRenounced: true,
      isFreezeDisabled: true,
      isLpLocked: true,
      lpLockedPercent: 100.0,
    },
    lastScannedAt: new Date().toISOString(),
  });

  const testRiskPolicy: RiskPolicyConfig = {
    maxPositionPercent: 5.0,
    maxDailyLossPercent: 3.0,
    maxTokenExposurePercent: 10.0,
    maxSlippagePercent: 0.5,
    maxOpenPositions: 3,
    minLiquidityUsd: 50000,
    emergencyStop: false,
    whitelistedQuoteMints: [PROTOCOL_CONSTANTS.QUOTE_MINTS.USDC_DEVNET],
    executionMode: "DEVNET",
  };

  beforeEach(() => {
    db.transactions = [];
    db.positions.clear();
    db.portfolio.totalEquityUsdc = 10000.0;
    db.portfolio.freeCashUsdc = 10000.0;
    db.portfolio.allocatedCapitalUsdc = 0;
  });

  describe("1. JupiterExecutionProvider", () => {
    test("should fetch quote, build transaction, simulate and execute swap when enabled", async () => {
      process.env.EXECUTION_ENABLED = "true";
      const provider = new JupiterExecutionProvider();
      const intent = createTestIntent(150.0);
      const signer = new MockSigner();

      const quote = await provider.getQuote({
        inputMint: intent.inputMint,
        outputMint: intent.outputMint,
        amount: intent.amountInRaw,
        slippageBps: intent.maxSlippageBps,
      });

      expect(quote.providerName).toBe("JUPITER");
      expect(quote.expectedOutputAmount).toBeGreaterThan(0n);

      const receipt = await provider.executeSwap(intent, signer);
      expect(receipt.success).toBe(true);
      expect(receipt.signature).toBeDefined();
      expect(receipt.slot).toBeGreaterThan(0);
      expect(receipt.provider).toBe("JUPITER");

      // Verify transaction persistence in database
      expect(db.transactions.length).toBe(1);
      const txRecord = db.transactions[0];
      expect(txRecord.signature).toBe(receipt.signature!);
      expect(txRecord.status).toBe("CONFIRMED");
      expect(txRecord.provider).toBe("JUPITER");
      expect(txRecord.amount).toBe(150.0);
      expect(txRecord.price).toBeGreaterThan(0);
    });
  });

  describe("2. MeteoraExecutionProvider", () => {
    test("should fetch DLMM quote with dynamic bin details and execute swap", async () => {
      process.env.EXECUTION_ENABLED = "true";
      const provider = new MeteoraExecutionProvider();
      const intent = createTestIntent(200.0);

      const quote = await provider.getQuote({
        inputMint: intent.inputMint,
        outputMint: intent.outputMint,
        amount: intent.amountInRaw,
        slippageBps: intent.maxSlippageBps,
      });

      expect(quote.providerName).toBe("METEORA");
      expect(quote.routePlan.activeBinId).toBe(24810);

      const receipt = await provider.executeSwap(intent);
      expect(receipt.success).toBe(true);
      expect(receipt.provider).toBe("METEORA");
      expect(db.transactions.length).toBe(1);
    });
  });

  describe("3. MockExecutionProvider & PaperExecutionProvider", () => {
    test("MockExecutionProvider should execute deterministically and support fault injection", async () => {
      const mockProvider = new MockExecutionProvider();
      const intent = createTestIntent(75.0);

      const receipt = await mockProvider.executeSwap(intent);
      expect(receipt.success).toBe(true);
      expect(receipt.provider).toBe("MOCK");

      // Test quote failure injection
      mockProvider.setMockConfig({ shouldFailQuote: true });
      const failReceipt = await mockProvider.executeSwap(intent);
      expect(failReceipt.success).toBe(false);
      expect(failReceipt.error).toContain("MOCK_QUOTE_ERROR");
    });

    test("PaperExecutionProvider should simulate forward paper trades with zero risk", async () => {
      const paperProvider = new PaperExecutionProvider();
      const intent = createTestIntent(100.0);

      const receipt = await paperProvider.executeSwap(intent);
      expect(receipt.success).toBe(true);
      expect(receipt.provider).toBe("PAPER");
    });
  });

  describe("4. Safety Gate & Invariants", () => {
    test("Should reject live execution if EXECUTION_ENABLED !== 'true'", async () => {
      process.env.EXECUTION_ENABLED = "false";
      const provider = new JupiterExecutionProvider();
      const intent = createTestIntent(100.0);

      const receipt = await provider.executeSwap(intent);
      expect(receipt.success).toBe(false);
      expect(receipt.error).toContain("EXECUTION_DISABLED");

      // Verify failure recorded in database
      expect(db.transactions.length).toBe(1);
      expect(db.transactions[0].status).toBe("FAILED");
      expect(db.transactions[0].error).toContain("EXECUTION_DISABLED");
    });
  });

  describe("5. ExecutionPipeline Integration", () => {
    test("Pipeline should process TradeIntent through RiskEngine and ExecutionProvider", async () => {
      const mockProvider = new MockExecutionProvider();
      const pipeline = new ExecutionPipeline(mockProvider);
      const intent = createTestIntent(250.0);
      const market = createTestMarket();

      const result = await pipeline.processTradeIntent(intent, market, testRiskPolicy);
      expect(result.riskApproved).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt!.success).toBe(true);
    });

    test("Pipeline should reject execution when RiskEngine vetoes proposal", async () => {
      const mockProvider = new MockExecutionProvider();
      const pipeline = new ExecutionPipeline(mockProvider);
      const intent = createTestIntent(250.0);
      const market = createTestMarket();

      // Trip emergency stop in policy
      const emergencyPolicy = { ...testRiskPolicy, emergencyStop: true };

      const result = await pipeline.processTradeIntent(intent, market, emergencyPolicy);
      expect(result.riskApproved).toBe(false);
      expect(result.rejectionReason).toContain("emergency stop");
      expect(result.receipt).toBeUndefined();
    });
  });
});
