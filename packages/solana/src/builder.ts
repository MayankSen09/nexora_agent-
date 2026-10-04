import { BuildSwapParams, CompiledTransaction, TransactionBuilder } from "./types.js";

export class SolanaTransactionBuilder implements TransactionBuilder {
  private defaultComputeUnitLimit: number;
  private defaultPriorityFeeMicroLamports: number;

  constructor(defaultComputeUnitLimit = 350000, defaultPriorityFeeMicroLamports = 50000) {
    this.defaultComputeUnitLimit = defaultComputeUnitLimit;
    this.defaultPriorityFeeMicroLamports = defaultPriorityFeeMicroLamports;
  }

  public async buildSwapTransaction(params: BuildSwapParams): Promise<CompiledTransaction> {
    const recentBlockhash = `blockhash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cuLimit = params.computeUnitLimit ?? this.defaultComputeUnitLimit;
    const priorityFee = params.priorityFeeMicroLamports ?? this.defaultPriorityFeeMicroLamports;

    // Constructs transaction wire payload
    const rawPayload = {
      header: {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
      },
      feePayer: params.userPublicKey,
      recentBlockhash,
      instructions: [
        {
          program: "ComputeBudget111111111111111111111111111111",
          type: "SetComputeUnitLimit",
          units: cuLimit,
        },
        {
          program: "ComputeBudget111111111111111111111111111111",
          type: "SetComputeUnitPrice",
          microLamports: priorityFee,
        },
        {
          program: "DEX_SWAP_PROGRAM",
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amountIn: params.amountIn.toString(),
          minAmountOut: params.minAmountOut.toString(),
          slippageBps: params.slippageBps,
        },
      ],
    };

    const serialized = Buffer.from(JSON.stringify(rawPayload)).toString("base64");

    return {
      serialized,
      recentBlockhash,
      feePayer: params.userPublicKey,
      instructionsCount: rawPayload.instructions.length,
      computeUnits: cuLimit,
      priorityFeeMicroLamports: priorityFee,
      rawPayload,
    };
  }
}
