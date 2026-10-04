import {
  ExecutionProvider,
  ExecutionReceipt,
  TradeIntent,
  TransactionSigner,
} from "./types.js";
import { MockExecutionProvider } from "./providers/mock.js";
import { MockSigner } from "@nexora/solana";
import { DeterministicRiskEngine } from "@nexora/risk-engine";
import { db } from "@nexora/database";
import { CandidateMarket, NexoraTradeDecision, RiskPolicyConfig } from "@nexora/shared";

export interface PipelineExecutionResult {
  intent: TradeIntent;
  riskApproved: boolean;
  rejectionReason?: string;
  receipt?: ExecutionReceipt;
}

export class ExecutionPipeline {
  private provider: ExecutionProvider;
  private signer: TransactionSigner;

  constructor(provider?: ExecutionProvider, signer?: TransactionSigner) {
    this.provider = provider ?? new MockExecutionProvider();
    this.signer = signer ?? new MockSigner();
  }

  public setProvider(provider: ExecutionProvider): void {
    this.provider = provider;
  }

  public setSigner(signer: TransactionSigner): void {
    this.signer = signer;
  }

  /**
   * Executes the full pipeline:
   * TradeIntent -> RiskEngine -> TransactionBuilder -> TransactionSimulator -> ExecutionProvider -> Solana -> TransactionVerifier
   */
  public async processTradeIntent(
    intent: TradeIntent,
    market: CandidateMarket,
    riskPolicy: RiskPolicyConfig
  ): Promise<PipelineExecutionResult> {
    // 1. Synthetic Decision for Risk Engine Validation
    const decision: NexoraTradeDecision = {
      action: intent.action,
      confidence: 90,
      positionSizePercent: (intent.amountInUsdc / db.portfolio.totalEquityUsdc) * 100,
      entryReason: `Pipeline Execution for ${intent.pairSymbol}`,
      riskLevel: "LOW",
      invalidationReason: "Risk limit violation",
      timeHorizon: "SHORT_15M",
      signals: [{ name: "pipeline_trigger", value: 1.0, weight: 1.0 }],
    };

    // 2. Deterministic Risk Engine Check
    const riskCheck = DeterministicRiskEngine.validateTradeProposal(
      decision,
      market,
      db.portfolio,
      riskPolicy,
      db.positions.size
    );

    if (!riskCheck.approved) {
      return {
        intent,
        riskApproved: false,
        rejectionReason: riskCheck.reasonMessage || riskCheck.reasonCode,
      };
    }

    // 3. Dispatch to Execution Provider (Build -> Simulate -> Sign -> Submit -> Verify -> Persist)
    const receipt = await this.provider.executeSwap(intent, this.signer);

    return {
      intent,
      riskApproved: true,
      receipt,
    };
  }
}
