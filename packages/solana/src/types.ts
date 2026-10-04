export type SolanaNetwork = "DEVNET" | "MAINNET" | "LOCALNET" | "PAPER_TRADING";

export interface InstructionPayload {
  programId: string;
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: string; // Base64 or Hex encoded instruction data
}

export interface BuildSwapParams {
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  amountIn: bigint;
  minAmountOut: bigint;
  slippageBps: number;
  priorityFeeMicroLamports?: number;
  computeUnitLimit?: number;
  routePlan?: any;
}

export interface CompiledTransaction {
  serialized: string;
  recentBlockhash: string;
  feePayer: string;
  instructionsCount: number;
  computeUnits: number;
  priorityFeeMicroLamports: number;
  rawPayload?: any;
}

export interface SimulationResult {
  success: boolean;
  logs: string[];
  unitsConsumed: number;
  error?: string;
}

export interface ConfirmationResult {
  confirmed: boolean;
  slot?: number;
  confirmationStatus?: "processed" | "confirmed" | "finalized";
  error?: string;
}

export interface TransactionSigner {
  readonly publicKey: string;
  signTransaction(serializedTx: string): Promise<string>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}

export interface TransactionBuilder {
  buildSwapTransaction(params: BuildSwapParams): Promise<CompiledTransaction>;
}

export interface TransactionSimulator {
  simulate(tx: CompiledTransaction): Promise<SimulationResult>;
}

export interface TransactionVerifier {
  verifyConfirmation(signature: string, timeoutMs?: number): Promise<ConfirmationResult>;
}
