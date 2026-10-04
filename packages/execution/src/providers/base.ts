import {
  CompiledTransaction,
  ExecutionOptions,
  ExecutionProvider,
  ExecutionProviderType,
  ExecutionReceipt,
  SimulationResult,
  SwapQuoteRequest,
  SwapQuoteResponse,
  TradeIntent,
  TransactionBuilder,
  TransactionSigner,
  TransactionSimulator,
  TransactionVerifier,
} from "../types.js";
import {
  SolanaTransactionBuilder,
  SolanaTransactionSimulator,
  SolanaTransactionVerifier,
  MockSigner,
} from "@nexora/solana";
import { db } from "@nexora/database";

export abstract class BaseExecutionProvider implements ExecutionProvider {
  public abstract readonly name: ExecutionProviderType;

  protected builder: TransactionBuilder;
  protected simulator: TransactionSimulator;
  protected verifier: TransactionVerifier;
  protected options: Required<ExecutionOptions>;

  constructor(
    builder?: TransactionBuilder,
    simulator?: TransactionSimulator,
    verifier?: TransactionVerifier,
    options: ExecutionOptions = {}
  ) {
    this.builder = builder ?? new SolanaTransactionBuilder();
    this.simulator = simulator ?? new SolanaTransactionSimulator();
    this.verifier = verifier ?? new SolanaTransactionVerifier();
    this.options = {
      timeoutMs: options.timeoutMs ?? 15000,
      maxRetries: options.maxRetries ?? 2,
      priorityFeeMicroLamports: options.priorityFeeMicroLamports ?? 50000,
      skipSimulation: options.skipSimulation ?? false,
    };
  }

  public abstract getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse>;

  public async buildSwapTransaction(
    quote: SwapQuoteResponse,
    userPublicKey: string
  ): Promise<CompiledTransaction> {
    return this.builder.buildSwapTransaction({
      userPublicKey,
      inputMint: quote.routePlan?.inputMint || "SOL",
      outputMint: quote.routePlan?.outputMint || "USDC",
      amountIn: quote.inputAmount,
      minAmountOut: quote.minimumOutputAmount,
      slippageBps: 50,
      priorityFeeMicroLamports: this.options.priorityFeeMicroLamports,
    });
  }

  public async simulateSwap(tx: CompiledTransaction): Promise<SimulationResult> {
    return this.simulator.simulate(tx);
  }

  public async executeSwap(
    intent: TradeIntent,
    signer?: TransactionSigner
  ): Promise<ExecutionReceipt> {
    const timestamp = new Date().toISOString();
    const effectiveSigner = signer ?? new MockSigner();

    // 1. Safety Check: Verify EXECUTION_ENABLED environment flag
    const isExecutionEnabled =
      process.env.EXECUTION_ENABLED === "true" ||
      this.name === "MOCK" ||
      this.name === "PAPER";

    if (!isExecutionEnabled) {
      const errorMsg = "[EXECUTION_DISABLED]: Real onchain execution is disabled. Set EXECUTION_ENABLED=true to enable live swaps.";
      
      db.recordTransaction({
        signature: `blocked_${Date.now()}`,
        status: "FAILED",
        provider: this.name,
        market: intent.marketAddress,
        action: intent.action,
        amount: intent.amountInUsdc,
        price: intent.expectedPriceUsdc,
        slippage: intent.maxSlippageBps / 100,
        timestamp,
        error: errorMsg,
      });

      return {
        success: false,
        inputAmount: intent.amountInRaw,
        outputAmount: 0n,
        executionPrice: intent.expectedPriceUsdc,
        computeUnitsConsumed: 0,
        provider: this.name,
        error: errorMsg,
        timestamp,
      };
    }

    // 2. Fetch Quote
    let quote: SwapQuoteResponse;
    try {
      quote = await this.getQuote({
        inputMint: intent.inputMint,
        outputMint: intent.outputMint,
        amount: intent.amountInRaw,
        slippageBps: intent.maxSlippageBps,
      });
    } catch (err: any) {
      const errorMsg = `[${this.name}_QUOTE_ERROR]: ${this.redactSecrets(err.message)}`;
      this.persistFailure(intent, errorMsg, timestamp);
      return {
        success: false,
        inputAmount: intent.amountInRaw,
        outputAmount: 0n,
        executionPrice: intent.expectedPriceUsdc,
        computeUnitsConsumed: 0,
        provider: this.name,
        error: errorMsg,
        timestamp,
      };
    }

    // 3. Build Transaction
    const tx = await this.buildSwapTransaction(quote, effectiveSigner.publicKey);

    // 4. Preflight Simulation
    if (!this.options.skipSimulation) {
      const simResult = await this.simulateSwap(tx);
      if (!simResult.success) {
        const errorMsg = `[${this.name}_SIMULATION_REVERT]: ${simResult.error || "Simulation failed"}`;
        this.persistFailure(intent, errorMsg, timestamp);
        return {
          success: false,
          inputAmount: intent.amountInRaw,
          outputAmount: 0n,
          executionPrice: intent.expectedPriceUsdc,
          computeUnitsConsumed: simResult.unitsConsumed,
          provider: this.name,
          error: errorMsg,
          timestamp,
        };
      }
    }

    // 5. Sign and Broadcast with Retry Loop
    let attempt = 0;
    let lastError = "";

    while (attempt <= this.options.maxRetries) {
      try {
        const signature = await effectiveSigner.signTransaction(tx.serialized);

        // 6. Verify Confirmation
        const confirmation = await this.verifier.verifyConfirmation(signature, this.options.timeoutMs);
        if (!confirmation.confirmed) {
          throw new Error(confirmation.error || "Transaction confirmation timed out.");
        }

        const executionPrice =
          intent.action === "BUY"
            ? intent.expectedPriceUsdc * (1 + (quote.priceImpactPct || 0) / 100)
            : intent.expectedPriceUsdc * (1 - (quote.priceImpactPct || 0) / 100);

        // 7. Persist Confirmed Transaction
        db.recordTransaction({
          signature,
          status: "CONFIRMED",
          provider: this.name,
          market: intent.marketAddress,
          action: intent.action,
          amount: intent.amountInUsdc,
          price: Math.round(executionPrice * 100) / 100,
          slippage: intent.maxSlippageBps / 100,
          timestamp,
        });

        return {
          success: true,
          signature,
          slot: confirmation.slot,
          inputAmount: intent.amountInRaw,
          outputAmount: quote.expectedOutputAmount,
          executionPrice: Math.round(executionPrice * 100) / 100,
          computeUnitsConsumed: tx.computeUnits,
          provider: this.name,
          timestamp,
        };
      } catch (err: any) {
        attempt++;
        lastError = this.redactSecrets(err.message || "Unknown broadcast error");
        if (attempt <= this.options.maxRetries) {
          // Dynamic priority fee escalation (+25% CU price) on retry
          tx.priorityFeeMicroLamports = Math.round(tx.priorityFeeMicroLamports * 1.25);
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // Retries exhausted
    this.persistFailure(intent, `[${this.name}_EXECUTION_FAILED]: ${lastError}`, timestamp);

    return {
      success: false,
      inputAmount: intent.amountInRaw,
      outputAmount: 0n,
      executionPrice: intent.expectedPriceUsdc,
      computeUnitsConsumed: 0,
      provider: this.name,
      error: lastError,
      timestamp,
    };
  }

  private persistFailure(intent: TradeIntent, error: string, timestamp: string): void {
    db.recordTransaction({
      signature: `failed_${Date.now()}`,
      status: "FAILED",
      provider: this.name,
      market: intent.marketAddress,
      action: intent.action,
      amount: intent.amountInUsdc,
      price: intent.expectedPriceUsdc,
      slippage: intent.maxSlippageBps / 100,
      timestamp,
      error,
    });
  }

  protected redactSecrets(text: string): string {
    // Redacts any 64-character base58 or hex private keys that might appear in error strings
    return text.replace(/[1-9A-HJ-NP-Za-km-z]{64,88}/g, "[REDACTED_SECRET]");
  }
}
