import { describe, it, expect, beforeEach } from "bun:test";
import { AgentController } from "../packages/agent/src/controller";
import { DatabaseStore } from "../packages/database/src";
import { PROTOCOL_CONSTANTS } from "../packages/shared/src";

describe("NEXORA End-to-End System Integration", () => {
  let db: DatabaseStore;
  let agent: AgentController;

  beforeEach(() => {
    AgentController.resetInstance();
    db = DatabaseStore.getInstance();
    agent = AgentController.getInstance();
  });

  it("should initialize full system state with healthy parameters", () => {
    const telemetry = agent.getTelemetry();
    expect(telemetry.agentId).toBeDefined();
    expect(telemetry.environment).toBe("DEVNET");

    const markets = db.getMarkets();
    expect(markets.length).toBeGreaterThan(0);

    const health = db.getSystemHealth();
    expect(health.status).toBe("HEALTHY");
    expect(health.solanaRpc.status).toBe("CONNECTED");
  });

  it("should execute autonomous trading cycle and evaluate invariants", async () => {
    agent.start("DEVNET");
    const initialTelemetry = agent.getTelemetry();
    expect(initialTelemetry.state).toBe("SCANNING");
    expect(initialTelemetry.environment).toBe("DEVNET");

    const result = await agent.step();
    expect(result.cycleNumber).toBeGreaterThan(0);
    expect(result.state).toBeDefined();
    expect(result.resultingAction).toBeDefined();

    const telemetryAfter = agent.getTelemetry();
    expect(telemetryAfter.currentCycle).toBe(result.cycleNumber);
  });

  it("should respond to emergency kill switch and pause instantly", () => {
    agent.start("DEVNET");
    expect(agent.getTelemetry().state).toBe("SCANNING");

    const pausedTelemetry = agent.pause("EMERGENCY_OPERATOR_TRIGGER", true);
    expect(pausedTelemetry.state).toBe("PAUSED");
    expect(pausedTelemetry.emergencyStopped).toBe(true);
  });
});
