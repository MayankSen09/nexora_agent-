import {
  NexoraTradeDecision,
  RiskPolicyConfig,
  CandidateMarket,
  PortfolioSummary,
  REJECTION_REASONS,
  RejectionReasonCode,
} from "@nexora/shared";

export interface RiskValidationResult {
  approved: boolean;
  reasonCode?: RejectionReasonCode;
  reasonMessage?: string;
  clampedSizeUsdc?: number;
  maxAllowedSlippageBps: number;
}

export class DeterministicRiskEngine {
  /**
   * Synchronous, zero-bypass deterministic risk validator.
   * Runs downstream of AI reasoning and holds unilateral veto authority.
   */
  public static validateTradeProposal(
    decision: NexoraTradeDecision,
    market: CandidateMarket,
    portfolio: PortfolioSummary,
    policy: RiskPolicyConfig,
    activePositionCount: number
  ): RiskValidationResult {
    // 1. Check Global Kill-Switch & Policy Disabled
    if (policy.emergencyStop) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_KILL_SWITCH_ACTIVE,
        reasonMessage: "Global emergency stop is currently active.",
        maxAllowedSlippageBps: 0,
      };
    }

    // 2. Reject non-BUY actions
    if (decision.action !== "BUY") {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_POLICY_DISABLED,
        reasonMessage: `Action is ${decision.action}, no entry execution required.`,
        maxAllowedSlippageBps: 0,
      };
    }

    // 3. Check 24-Hour Portfolio Drawdown Circuit Breaker
    if (portfolio.realizedPnl24hPct <= -policy.maxDailyLossPercent) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_DAILY_LOSS_LIMIT,
        reasonMessage: `Daily loss limit of -${policy.maxDailyLossPercent}% breached (Current: ${portfolio.realizedPnl24hPct}%).`,
        maxAllowedSlippageBps: 0,
      };
    }

    // 4. Check Max Concurrent Open Positions
    if (activePositionCount >= policy.maxOpenPositions) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_MAX_OPEN_POSITIONS,
        reasonMessage: `Maximum open positions limit (${policy.maxOpenPositions}) reached.`,
        maxAllowedSlippageBps: 0,
      };
    }

    // 5. Check Token Security Invariant
    if (!market.securityStatus.isMintRenounced || !market.securityStatus.isFreezeDisabled) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_TOKEN_UNSAFE,
        reasonMessage: "Token security check failed: Mint or Freeze authority is active.",
        maxAllowedSlippageBps: 0,
      };
    }

    // 6. Check Pool Liquidity Depth
    if (market.metrics.liquidityDepthUsdc < policy.minLiquidityUsd) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_LOW_LIQUIDITY,
        reasonMessage: `Pool depth ($${market.metrics.liquidityDepthUsdc}) is below minimum requirement ($${policy.minLiquidityUsd}).`,
        maxAllowedSlippageBps: 0,
      };
    }

    // 7. Check Volatility Ceiling
    if (market.metrics.realizedVolatility1hPct > 6.0) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_HIGH_VOLATILITY,
        reasonMessage: `1-hour realized volatility (${market.metrics.realizedVolatility1hPct}%) exceeds maximum safe threshold (6.0%).`,
        maxAllowedSlippageBps: 0,
      };
    }

    // 8. Calculate and Clamp Position Sizing
    const maxAllowedSizeUsdc = (portfolio.totalEquityUsdc * policy.maxPositionPercent) / 100.0;
    const requestedSizeUsdc = (portfolio.totalEquityUsdc * decision.positionSizePercent) / 100.0;
    const finalSizeUsdc = Math.min(requestedSizeUsdc, maxAllowedSizeUsdc);

    if (finalSizeUsdc < 25.0) {
      return {
        approved: false,
        reasonCode: REJECTION_REASONS.RISK_POSITION_TOO_LARGE,
        reasonMessage: "Calculated position size is below minimum $25.00 threshold.",
        maxAllowedSlippageBps: 0,
      };
    }

    // 9. All Deterministic Checks Passed
    return {
      approved: true,
      clampedSizeUsdc: finalSizeUsdc,
      maxAllowedSlippageBps: Math.round(policy.maxSlippagePercent * 100),
    };
  }
}
