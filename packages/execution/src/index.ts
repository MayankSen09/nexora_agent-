export interface SwapQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: bigint;
  slippageBps: number;
}

export interface SwapQuoteResponse {
  providerName: "JUPITER" | "METEORA" | "PAPER";
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
  error?: string;
}

export interface ExecutionProvider {
  readonly name: string;
  getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse>;
}
