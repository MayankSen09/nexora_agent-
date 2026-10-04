import { describe, test, expect } from "bun:test";
import {
  SolanaCluster,
  KeypairSigner,
  MockSigner,
  SolanaTransactionBuilder,
  SolanaTransactionSimulator,
  SolanaTransactionVerifier,
} from "../index.js";

describe("Solana Integration Layer (@nexora/solana)", () => {
  describe("1. SolanaCluster", () => {
    test("should resolve correct devnet and mainnet endpoints", () => {
      expect(SolanaCluster.getRpcUrl("DEVNET")).toContain("devnet.solana.com");
      expect(SolanaCluster.getRpcUrl("MAINNET")).toContain("mainnet-beta.solana.com");
      expect(SolanaCluster.getWsUrl("DEVNET")).toContain("wss://");
    });
  });

  describe("2. KeypairSigner & Security Invariants", () => {
    test("KeypairSigner should sign transactions without leaking secret bytes in logs", async () => {
      const dummySecret = new Uint8Array(64).fill(7);
      const pubkey = "7Nf...pubkey";
      const signer = new KeypairSigner(pubkey, dummySecret);

      const signature = await signer.signTransaction("serialized_tx_payload");
      expect(signature).toContain("sig_7Nf");

      // Verify JSON serialization redaction
      const jsonStr = JSON.stringify(signer);
      expect(jsonStr).toContain("[REDACTED]");
      expect(jsonStr).not.toContain("dummySecret");

      // Cleanup
      signer.destroy();
    });

    test("MockSigner should generate deterministic signature", async () => {
      const mock = new MockSigner();
      const sig = await mock.signTransaction("payload");
      expect(sig).toContain("sig_mock_");
    });
  });

  describe("3. SolanaTransactionBuilder", () => {
    test("should build and serialize versioned transaction with compute budget", async () => {
      const builder = new SolanaTransactionBuilder(350000, 50000);
      const tx = await builder.buildSwapTransaction({
        userPublicKey: "UserPubkey1111111111111111111111111111111",
        inputMint: "SOL",
        outputMint: "USDC",
        amountIn: 1000000000n,
        minAmountOut: 148000000n,
        slippageBps: 50,
      });

      expect(tx.serialized).toBeDefined();
      expect(tx.computeUnits).toBe(350000);
      expect(tx.priorityFeeMicroLamports).toBe(50000);
      expect(tx.instructionsCount).toBe(3);
    });
  });

  describe("4. SolanaTransactionSimulator", () => {
    test("should simulate valid transaction successfully with compute unit telemetry", async () => {
      const builder = new SolanaTransactionBuilder();
      const simulator = new SolanaTransactionSimulator(1.0);

      const tx = await builder.buildSwapTransaction({
        userPublicKey: "UserPubkey",
        inputMint: "SOL",
        outputMint: "USDC",
        amountIn: 1000000000n,
        minAmountOut: 148000000n,
        slippageBps: 50,
      });

      const simResult = await simulator.simulate(tx);
      expect(simResult.success).toBe(true);
      expect(simResult.unitsConsumed).toBeGreaterThan(0);
      expect(simResult.logs.length).toBeGreaterThan(0);
    });

    test("should capture simulation failure on simulated error", async () => {
      const builder = new SolanaTransactionBuilder();
      const simulator = new SolanaTransactionSimulator(0.0); // 0% success rate

      const tx = await builder.buildSwapTransaction({
        userPublicKey: "UserPubkey",
        inputMint: "SOL",
        outputMint: "USDC",
        amountIn: 1000000000n,
        minAmountOut: 148000000n,
        slippageBps: 50,
      });

      const simResult = await simulator.simulate(tx);
      expect(simResult.success).toBe(false);
      expect(simResult.error).toBe("SLIPPAGE_TOLERANCE_EXCEEDED");
    });
  });

  describe("5. SolanaTransactionVerifier", () => {
    test("should verify transaction confirmation slot and commitment status", async () => {
      const verifier = new SolanaTransactionVerifier();
      const result = await verifier.verifyConfirmation("5Kj8b3Z...devnet");

      expect(result.confirmed).toBe(true);
      expect(result.slot).toBeGreaterThan(0);
      expect(result.confirmationStatus).toBe("confirmed");
    });
  });
});
