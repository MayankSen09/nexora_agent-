import { db } from "@nexora/database";
import { agent } from "@nexora/agent";
import {
  ApiResponse,
  GetMarketsResponse,
  GetAgentResponse,
  GetPositionsResponse,
  GetTradesResponse,
  GetPortfolioResponse,
  GetDecisionsResponse,
  GetRiskEventsResponse,
  GetSystemHealthResponse,
  CandidateMarket,
  StartAgentRequestSchema,
  PauseAgentRequestSchema,
  GetMarketsQuerySchema,
  GetDecisionsQuerySchema,
  PROTOCOL_CONSTANTS,
} from "@nexora/shared";
import { ZodError } from "zod";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

function jsonResponse<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function errorResponse(code: string, message: string, status = 400, details?: any): Response {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function parseJsonBody(req: Request): Promise<{ data: any; error?: string }> {
  try {
    const text = await req.text();
    if (!text || text.trim() === "") {
      return { data: {} };
    }
    const data = JSON.parse(text);
    return { data };
  } catch (err: any) {
    return { data: null, error: err.message || "Invalid JSON payload" };
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // 1. GET /api/markets
      if (method === "GET" && path === "/api/markets") {
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const parsed = GetMarketsQuerySchema.safeParse(queryParams);
        if (!parsed.success) {
          return errorResponse("INVALID_QUERY", "Invalid query parameters", 400, parsed.error.format());
        }
        const { minScore, venue } = parsed.data;
        const markets = db.getMarkets(minScore, venue);
        const res: GetMarketsResponse = {
          markets,
          total: markets.length,
        };
        return jsonResponse(res);
      }

      // 2. GET /api/markets/:address
      if (method === "GET" && path.startsWith("/api/markets/")) {
        const address = path.replace("/api/markets/", "").trim();
        if (!address) {
          return errorResponse("BAD_REQUEST", "Market address is required", 400);
        }
        const market = db.getMarketByAddress(address);
        if (!market) {
          return errorResponse("NOT_FOUND", `Market with address ${address} not found`, 404);
        }
        return jsonResponse<CandidateMarket>(market);
      }

      // 3. GET /api/agent
      if (method === "GET" && path === "/api/agent") {
        const telemetry = agent.getTelemetry();
        const res: GetAgentResponse = { telemetry };
        return jsonResponse(res);
      }

      // 4. POST /api/agent/start
      if (method === "POST" && path === "/api/agent/start") {
        const { data: bodyJson, error } = await parseJsonBody(req);
        if (error) {
          return errorResponse("MALFORMED_JSON", error, 400);
        }
        const parsed = StartAgentRequestSchema.safeParse(bodyJson);
        if (!parsed.success) {
          return errorResponse("VALIDATION_ERROR", "Invalid start agent payload", 400, parsed.error.format());
        }
        const telemetry = agent.start(parsed.data.environment);
        return jsonResponse({ telemetry, message: `Agent started in ${telemetry.environment} mode.` });
      }

      // 5. POST /api/agent/pause
      if (method === "POST" && path === "/api/agent/pause") {
        const { data: bodyJson, error } = await parseJsonBody(req);
        if (error) {
          return errorResponse("MALFORMED_JSON", error, 400);
        }
        const parsed = PauseAgentRequestSchema.safeParse(bodyJson);
        if (!parsed.success) {
          return errorResponse("VALIDATION_ERROR", "Invalid pause agent payload", 400, parsed.error.format());
        }
        const telemetry = agent.pause(parsed.data.reason, parsed.data.panicLiquidate);
        return jsonResponse({ telemetry, message: "Agent successfully paused." });
      }

      // 6. GET /api/positions
      if (method === "GET" && path === "/api/positions") {
        const positions = db.getPositions();
        const res: GetPositionsResponse = {
          positions,
          totalOpenPositions: positions.length,
        };
        return jsonResponse(res);
      }

      // 7. GET /api/trades
      if (method === "GET" && path === "/api/trades") {
        const trades = db.getTrades();
        const res: GetTradesResponse = {
          trades,
          totalTrades: trades.length,
        };
        return jsonResponse(res);
      }

      // 8. GET /api/portfolio
      if (method === "GET" && path === "/api/portfolio") {
        const res: GetPortfolioResponse = {
          summary: db.portfolio,
        };
        return jsonResponse(res);
      }

      // 9. GET /api/decisions
      if (method === "GET" && path === "/api/decisions") {
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const parsed = GetDecisionsQuerySchema.safeParse(queryParams);
        const limit = parsed.success ? parsed.data.limit : 20;
        const offset = parsed.success ? parsed.data.offset : 0;
        const decisions = db.getDecisions(limit, offset);
        const res: GetDecisionsResponse = {
          decisions,
          total: db.decisions.length,
        };
        return jsonResponse(res);
      }

      // 10. GET /api/risk/events
      if (method === "GET" && path === "/api/risk/events") {
        const events = db.getRiskEvents();
        const res: GetRiskEventsResponse = {
          events,
          total: events.length,
        };
        return jsonResponse(res);
      }

      // 11. POST /api/positions/:id/close
      if (method === "POST" && path.startsWith("/api/positions/") && path.endsWith("/close")) {
        const parts = path.split("/");
        const id = parts[3];
        const pos = db.closePosition(id, "MANUAL_OPERATOR_CLOSE");
        if (!pos) {
          return errorResponse("NOT_FOUND", `Position ${id} not found or already closed`, 404);
        }
        return jsonResponse({ message: `Position ${id} closed successfully`, position: pos });
      }

      // 12. GET /api/transactions
      if (method === "GET" && path === "/api/transactions") {
        const txs = db.getTransactions();
        return jsonResponse({ transactions: txs, total: txs.length });
      }

      // 13. GET /api/transactions/:sig
      if (method === "GET" && path.startsWith("/api/transactions/")) {
        const sig = path.replace("/api/transactions/", "").trim();
        const tx = db.getTransactionBySignature(sig);
        if (!tx) {
          return errorResponse("NOT_FOUND", `Transaction ${sig} not found`, 404);
        }
        return jsonResponse(tx);
      }

      // 14. GET /api/system/health
      if (method === "GET" && path === "/api/system/health") {
        const health: GetSystemHealthResponse = db.getSystemHealth();
        return jsonResponse(health);
      }

      // Root ping
      if (path === "/" || path === "/api") {
        return jsonResponse({
          name: PROTOCOL_CONSTANTS.NAME,
          version: PROTOCOL_CONSTANTS.VERSION,
          status: "ONLINE",
          endpoints: [
            "/api/markets",
            "/api/markets/:address",
            "/api/agent",
            "/api/agent/start",
            "/api/agent/pause",
            "/api/positions",
            "/api/positions/:id/close",
            "/api/trades",
            "/api/transactions",
            "/api/transactions/:sig",
            "/api/portfolio",
            "/api/decisions",
            "/api/risk/events",
            "/api/system/health",
          ],
        });
      }

      return errorResponse("ROUTE_NOT_FOUND", `Cannot ${method} ${path}`, 404);
    } catch (err: any) {
      console.error(`[API Server Error]:`, err);
      return errorResponse("INTERNAL_SERVER_ERROR", err.message || "An unexpected error occurred", 500);
    }
  },
});

console.log(`[NEXORA API] Server listening on http://localhost:${server.port}`);
