import { BaseExecutionProvider } from "./base.js";
import { ExecutionProviderType, SwapQuoteRequest, SwapQuoteResponse } from "../types.js";

export class MeteoraExecutionProvider extends BaseExecutionProvider {
  public readonly name: ExecutionProviderType = "METEORA";
  private dlmmApiUrl: string;

  constructor(dlmmApiUrl = "https://dlmm-api.meteora.ag") {
    super();
    this.dlmmApiUrl = dlmmApiUrl;
  }

  public async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    const inputNum = Number(request.amount);
    const expectedOut = BigInt(Math.floor(inputNum * 0.9975)); // 0.25% DLMM dynamic fee
    const minOut = BigInt(Math.floor(Number(expectedOut) * (1 - request.slippageBps / 10000)));

    return {
      providerName: this.name,
      inputAmount: request.amount,
      expectedOutputAmount: expectedOut,
      minimumOutputAmount: minOut,
      priceImpactPct: 0.02,
      feeUsdc: 0.35,
      routePlan: {
        protocol: "METEORA_DLMM",
        inputMint: request.inputMint,
        outputMint: request.outputMint,
        activeBinId: 24810,
        binStep: 10,
      },
    };
  }
}
