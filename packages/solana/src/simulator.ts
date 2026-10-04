import { CompiledTransaction, SimulationResult, TransactionSimulator } from "./types.js";

export class SolanaTransactionSimulator implements TransactionSimulator {
  private simulatedSuccessRate: number;

  constructor(simulatedSuccessRate = 1.0) {
    this.simulatedSuccessRate = simulatedSuccessRate;
  }

  public setSimulatedSuccessRate(rate: number): void {
    this.simulatedSuccessRate = rate;
  }

  public async simulate(tx: CompiledTransaction): Promise<SimulationResult> {
    if (!tx.serialized) {
      return {
        success: false,
        logs: ["Program Error: Empty serialized transaction"],
        unitsConsumed: 0,
        error: "INVALID_TRANSACTION_PAYLOAD",
      };
    }

    // Simulate preflight checks
    if (Math.random() > this.simulatedSuccessRate) {
      return {
        success: false,
        logs: [
          "Program ComputeBudget111111111111111111111111111111 invoke [1]",
          "Program ComputeBudget111111111111111111111111111111 success",
          "Program DEX_SWAP_PROGRAM invoke [1]",
          "Program log: Error: Slippage tolerance exceeded",
          "Program DEX_SWAP_PROGRAM failed: custom program error: 0x1771",
        ],
        unitsConsumed: 184200,
        error: "SLIPPAGE_TOLERANCE_EXCEEDED",
      };
    }

    return {
      success: true,
      logs: [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "Program DEX_SWAP_PROGRAM invoke [1]",
        "Program log: Instruction: RouteSwap",
        "Program log: Swap successful. Transferred tokens.",
        "Program DEX_SWAP_PROGRAM consumed 142050 of 350000 compute units",
        "Program DEX_SWAP_PROGRAM success",
      ],
      unitsConsumed: 142050,
    };
  }
}
