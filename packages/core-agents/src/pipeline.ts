import type { GuardrailProfile } from "@sistema/guardrails";
import { getAgent, runAgent, type RuntimeHooks } from "./runtime";
import type { AgentInput } from "./types";

export type PipelineStep = {
  agentId: string;
  briefFrom: (ctx: PipelineContext) => unknown;
  optional?: boolean;
};

export type Pipeline = { id: string; label: string; steps: PipelineStep[] };

export type PipelineContext = {
  workspaceId: string;
  projectId?: string;
  outputs: Record<string, unknown>;
  base: Omit<AgentInput<unknown>, "brief">;
};

export type PipelineResult = {
  outputs: Record<string, unknown>;
  stages: Record<string, { ok: boolean; error?: string }>;
};

/** Un paso opcional que falla se registra y la cadena continúa. */
export async function runPipeline(
  p: Pipeline,
  ctx: PipelineContext,
  profile: GuardrailProfile,
  hooks: RuntimeHooks = {},
): Promise<PipelineResult> {
  const stages: PipelineResult["stages"] = {};
  for (const step of p.steps) {
    const agent = getAgent(step.agentId);
    if (!agent) { stages[step.agentId] = { ok: false, error: "agente no registrado" }; continue; }
    try {
      const out = await runAgent(agent, { ...ctx.base, brief: step.briefFrom(ctx) }, profile, hooks);
      ctx.outputs[step.agentId] = out.data;
      stages[step.agentId] = { ok: true };
    } catch (err) {
      stages[step.agentId] = { ok: false, error: (err as Error).message };
      if (!step.optional) break;
    }
  }
  return { outputs: ctx.outputs, stages };
}
