import { BaseExecutionProvider } from "./base.js";
import { ExecutionProviderType, SwapQuoteRequest, SwapQuoteResponse } from "../types.js";

export interface MockExecutionConfig {
  shouldFailQuote?: boolean;
  shouldFailSimulation?: boolean;
  priceImpactPct?: number;
  feeUsdc?: number;
}

export class MockExecutionProvider extends BaseExecutionProvider {
  public readonly name: ExecutionProviderType = "MOCK";
  private mockConfig: MockExecutionConfig;

  constructor(config: MockExecutionConfig = {}) {
    super();
    this.mockConfig = {
      shouldFailQuote: config.shouldFailQuote ?? false,
      shouldFailSimulation: config.shouldFailSimulation ?? false,
      priceImpactPct: config.priceImpactPct ?? 0.05,
      feeUsdc: config.feeUsdc ?? 0.20,
    };
  }

  public setMockConfig(update: Partial<MockExecutionConfig>): void {
    this.mockConfig = { ...this.mockConfig, ...update };
  }

  public async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    if (this.mockConfig.shouldFailQuote) {
      throw new Error("[MockExecutionProvider]: Simulated quote calculation failure.");
    }

    const inputNum = Number(request.amount);
    const expectedOut = BigInt(Math.floor(inputNum * 0.998));
    const minOut = BigInt(Math.floor(Number(expectedOut) * (1 - request.slippageBps / 10000)));

    return {
      providerName: this.name,
      inputAmount: request.amount,
      expectedOutputAmount: expectedOut,
      minimumOutputAmount: minOut,
      priceImpactPct: this.mockConfig.priceImpactPct!,
      feeUsdc: this.mockConfig.feeUsdc!,
      routePlan: {
        protocol: "MOCK_DEX",
        inputMint: request.inputMint,
        outputMint: request.outputMint,
      },
    };
  }
}
