import { BaseExecutionProvider } from "./base.js";
import { ExecutionProviderType, SwapQuoteRequest, SwapQuoteResponse } from "../types.js";

export class PaperExecutionProvider extends BaseExecutionProvider {
  public readonly name: ExecutionProviderType = "PAPER";

  public async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    const inputNum = Number(request.amount);
    const expectedOut = BigInt(Math.floor(inputNum * 0.999)); // 0.1% simulated paper fee
    const minOut = BigInt(Math.floor(Number(expectedOut) * (1 - request.slippageBps / 10000)));

    return {
      providerName: this.name,
      inputAmount: request.amount,
      expectedOutputAmount: expectedOut,
      minimumOutputAmount: minOut,
      priceImpactPct: 0.01,
      feeUsdc: 0.10,
      routePlan: {
        protocol: "PAPER_SIMULATOR",
        inputMint: request.inputMint,
        outputMint: request.outputMint,
      },
    };
  }
}
