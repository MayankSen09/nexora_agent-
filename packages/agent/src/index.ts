import { AgentState, AgentTelemetry, ExecutionEnvironment } from "@nexora/shared";
import { db } from "@nexora/database";

export class AgentController {
  private static instance: AgentController;

  private constructor() {}

  public static getInstance(): AgentController {
    if (!AgentController.instance) {
      AgentController.instance = new AgentController();
    }
    return AgentController.instance;
  }

  public getTelemetry(): AgentTelemetry {
    return db.agentTelemetry;
  }

  public start(env?: ExecutionEnvironment): AgentTelemetry {
    return db.startAgent(env);
  }

  public pause(reason = "MANUAL_USER_PAUSE", panicLiquidate = false): AgentTelemetry {
    return db.pauseAgent(reason, panicLiquidate);
  }
}

export const agent = AgentController.getInstance();
