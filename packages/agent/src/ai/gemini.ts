import { AIProvider, MarketAnalysisContext } from "../types.js";
import { NexoraTradeDecision, NexoraTradeDecisionSchema } from "@nexora/shared";

export interface GeminiProviderConfig {
  apiKey?: string;
  modelName?: string;
  endpointUrl?: string;
  timeoutMs?: number;
}

export class GeminiAIProvider implements AIProvider {
  public readonly name = "GOOGLE_GEMINI_PRO";
  private apiKey: string;
  private modelName: string;
  private timeoutMs: number;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = config.modelName || "gemini-2.5-flash";
    this.timeoutMs = config.timeoutMs || 3000;
  }

  public async analyzeMarket(context: MarketAnalysisContext): Promise<NexoraTradeDecision> {
    if (!this.apiKey) {
      // In development / demo environments without API keys, fail closed to safe AVOID
      return {
        action: "AVOID",
        confidence: 0,
        positionSizePercent: 0,
        entryReason: "GEMINI_API_KEY is not set. Execution halted for safety.",
        riskLevel: "HIGH",
        invalidationReason: "Missing AI authentication credentials.",
        timeHorizon: "SCALP_5M",
        signals: context.signals,
      };
    }

    const systemPrompt = `You are NEXORA Quant Engine, an autonomous trading reasoning agent on Solana.
Analyze the candidate market metrics, technical signals, and portfolio risk context.
Output STRICT JSON adhering to this schema:
{
  "action": "BUY" | "SELL" | "HOLD" | "AVOID",
  "confidence": number (0 to 100),
  "positionSizePercent": number (0.0 to 10.0),
  "entryReason": string (max 350 chars),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "invalidationReason": string (max 350 chars),
  "timeHorizon": "SCALP_5M" | "SHORT_15M" | "SWING_1H" | "POSITION_4H",
  "signals": [
    { "name": string, "value": number, "weight": number }
  ]
}

DO NOT include markdown fences, backticks, or preamble. Return RAW JSON ONLY.`;

    const userPrompt = JSON.stringify({
      market: {
        address: context.market.address,
        pair: `${context.market.baseToken.symbol}/${context.market.quoteToken.symbol}`,
        venue: context.market.venue,
        priceUsdc: context.market.metrics.priceUsdc,
        volume24hUsdc: context.market.metrics.volume24hUsdc,
        volume15mUsdc: context.market.metrics.volume15mUsdc,
        liquidityDepthUsdc: context.market.metrics.liquidityDepthUsdc,
        feeAprPct: context.market.metrics.feeAprPct,
        orderFlowImbalance: context.market.metrics.orderFlowImbalance,
        realizedVolatility1hPct: context.market.metrics.realizedVolatility1hPct,
      },
      signals: context.signals,
      opportunityScore: context.opportunityScore,
      portfolio: {
        totalEquityUsdc: context.portfolio.totalEquityUsdc,
        freeCashUsdc: context.portfolio.freeCashUsdc,
        realizedPnl24hPct: context.portfolio.realizedPnl24hPct,
        activePositionsCount: context.activePositionsCount,
      },
      riskLimits: {
        maxPositionPercent: context.riskPolicy.maxPositionPercent,
        maxDailyLossPercent: context.riskPolicy.maxDailyLossPercent,
      },
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`[GeminiAIProvider]: API error HTTP ${response.status}: ${await response.text()}`);
      }

      const data: any = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("[GeminiAIProvider]: Empty text response from Gemini API.");
      }

      const parsedJson = JSON.parse(rawText);
      const validated = NexoraTradeDecisionSchema.parse(parsedJson);
      return validated;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`[GeminiAIProvider Error]: ${err.message}. Defaulting to safe AVOID.`);
      return {
        action: "AVOID",
        confidence: 0,
        positionSizePercent: 0,
        entryReason: `AI inference failed: ${err.message}`,
        riskLevel: "HIGH",
        invalidationReason: "AI runtime exception",
        timeHorizon: "SCALP_5M",
        signals: context.signals,
      };
    }
  }
}
