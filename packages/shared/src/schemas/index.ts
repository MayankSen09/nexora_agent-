import { z } from "zod";

export const DecisionSignalSchema = z.object({
  name: z.string().min(1),
  value: z.number().min(-10.0).max(10.0),
  weight: z.number().min(0.0).max(1.0),
});

export const NexoraTradeDecisionSchema = z.object({
  action: z.enum(["BUY", "SELL", "HOLD", "AVOID"]),
  confidence: z.number().min(0).max(100),
  positionSizePercent: z.number().min(0.0).max(10.0),
  entryReason: z.string().max(350),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  invalidationReason: z.string().max(350),
  timeHorizon: z.enum(["SCALP_5M", "SHORT_15M", "SWING_1H", "POSITION_4H"]),
  signals: z.array(DecisionSignalSchema).min(1),
});

export const RiskPolicyConfigSchema = z.object({
  maxPositionPercent: z.number().min(1.0).max(10.0).default(5.0),
  maxDailyLossPercent: z.number().min(1.0).max(10.0).default(3.0),
  maxTokenExposurePercent: z.number().min(1.0).max(20.0).default(10.0),
  maxSlippagePercent: z.number().min(0.1).max(2.0).default(0.5),
  maxOpenPositions: z.number().int().min(1).max(5).default(3),
  minLiquidityUsd: z.number().min(10000).default(50000),
  emergencyStop: z.boolean().default(false),
  whitelistedQuoteMints: z.array(z.string()).min(1),
  executionMode: z.enum(["PAPER_TRADING", "DEVNET", "MAINNET"]).default("PAPER_TRADING"),
});

export const StartAgentRequestSchema = z.object({
  environment: z.enum(["PAPER_TRADING", "DEVNET", "MAINNET"]).optional().default("DEVNET"),
  cycleIntervalSeconds: z.number().min(5).max(120).optional().default(15),
});

export const PauseAgentRequestSchema = z.object({
  reason: z.string().optional().default("MANUAL_USER_PAUSE"),
  panicLiquidate: z.boolean().optional().default(false),
});

export const GetMarketsQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(100).optional(),
  venue: z.enum(["METEORA_DLMM", "METEORA_DYNAMIC", "JUPITER"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

export const GetDecisionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});
