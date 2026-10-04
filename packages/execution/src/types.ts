import {
  CompiledTransaction,
  SimulationResult,
  ConfirmationResult,
  TransactionSigner,
  TransactionBuilder,
  TransactionSimulator,
  TransactionVerifier,
} from "@nexora/solana";
import { TransactionRecord } from "@nexora/shared";

export type {
  CompiledTransaction,
  SimulationResult,
  ConfirmationResult,
  TransactionSigner,
  TransactionBuilder,
  TransactionSimulator,
  TransactionVerifier,
};

export type ExecutionProviderType = "JUPITER" | "METEORA" | "MOCK" | "PAPER";

export interface TradeIntent {
  id: string;
  marketAddress: string;
  pairSymbol: string;
  action: "BUY" | "SELL";
  inputMint: string;
  outputMint: string;
  amountInUsdc: number;
  amountInRaw: bigint;
  maxSlippageBps: number;
  expectedPriceUsdc: number;
  minOutputRaw?: bigint;
  userPublicKey?: string;
  timestamp: string;
}

export interface SwapQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: bigint;
  slippageBps: number;
}

export interface SwapQuoteResponse {
  providerName: ExecutionProviderType;
  inputAmount: bigint;
  expectedOutputAmount: bigint;
  minimumOutputAmount: bigint;
  priceImpactPct: number;
  feeUsdc: number;
  routePlan?: any;
}

export interface ExecutionReceipt {
  success: boolean;
  signature?: string;
  slot?: number;
  inputAmount: bigint;
  outputAmount: bigint;
  executionPrice: number;
  computeUnitsConsumed: number;
  provider: ExecutionProviderType;
  error?: string;
  timestamp: string;
}

export interface ExecutionOptions {
  timeoutMs?: number;
  maxRetries?: number;
  priorityFeeMicroLamports?: number;
  skipSimulation?: boolean;
}

export interface ExecutionProvider {
  readonly name: ExecutionProviderType;
  getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse>;
  buildSwapTransaction(quote: SwapQuoteResponse, userPublicKey: string): Promise<CompiledTransaction>;
  executeSwap(intent: TradeIntent, signer?: TransactionSigner): Promise<ExecutionReceipt>;
  simulateSwap(tx: CompiledTransaction): Promise<SimulationResult>;
}
