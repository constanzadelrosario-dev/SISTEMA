import { callLlmJson } from "@sistema/core-llm";
import { type GuardContext, type GuardrailProfile, runChecks } from "@sistema/guardrails";
import { emptyBrain, mergeBrain, renderBrain, sliceBrain } from "./brain";
import type { AgentDef, AgentInput, AgentOutput } from "./types";

export type RuntimeHooks = {
  /** Persiste en agent_runs. */
  recordRun?: (row: Record<string, unknown>) => Promise<string | undefined>;
  /** Crea gaps para los datos que faltaron. */
  recordGaps?: (workspaceId: string, fields: string[], raisedBy: string) => Promise<void>;
  resolveProfile?: (input: AgentInput<unknown>) => Promise<GuardrailProfile>;
};

const registry = new Map<string, AgentDef<unknown, unknown>>();

export function defineAgent<B, T>(def: AgentDef<B, T>): AgentDef<B, T> {
  registry.set(def.id, def as AgentDef<unknown, unknown>);
  return def;
}
export const getAgent = (id: string) => registry.get(id);
export const listAgents = () => [...registry.values()];

/**
 * Ejecuta un agente. Hace siempre, sin que el agente tenga que acordarse:
 *  1. arma solo el contexto declarado en `needs`
 *  2. llama al modelo validando contra el esquema de salida
 *  3. corre los guardrails del perfil vigente
 *  4. reintenta UNA vez con las observaciones si algo duro falló
 *  5. registra la corrida completa
 *  6. convierte lo que faltó en gaps
 */
export async function runAgent<B, T>(
  agent: AgentDef<B, T>,
  input: AgentInput<B>,
  profile: GuardrailProfile,
  hooks: RuntimeHooks = {},
): Promise<AgentOutput<T> & { checks: Awaited<ReturnType<typeof runChecks>> }> {
  const brief = agent.briefSchema.parse(input.brief);

  const base = input.contextSource === "manual" ? emptyBrain() : (input.brain ?? emptyBrain());
  const full = mergeBrain(base, input.manualContext);
  const brain = sliceBrain(full, agent.needs);

  const guardCtx: GuardContext = {
    brain,
    domain: ((brief as Record<string, unknown>).domain as GuardContext["domain"]) ?? "general",
  };

  const system = agent.system({ ...input, brief });
  const contexto = renderBrain(brain);
  const started = Date.now();

  let observaciones = "";
  let data!: T;
  let meta!: { provider: string; model: string; latencyMs: number };
  let checks!: Awaited<ReturnType<typeof runChecks>>;

  for (let intento = 0; intento < 2; intento++) {
    const messages = [
      { role: "system" as const, content: system },
      {
        role: "user" as const,
        content:
          `${contexto}\n\nBRIEF:\n${JSON.stringify(brief, null, 2)}` +
          (observaciones ? `\n\nCORRIGE ESTO DE TU INTENTO ANTERIOR:\n${observaciones}` : ""),
      },
    ];

    const res = await callLlmJson(messages, agent.outputSchema, {
      task: agent.task ?? "generacion",
      ...input.options,
    });
    data = res.data;
    meta = { provider: res.provider, model: res.model, latencyMs: Date.now() - started };

    const texto = agent.textForChecks?.(data) ?? JSON.stringify(data);
    checks = await runChecks(texto, guardCtx, profile);
    if (!checks.blocked) break;
    observaciones = checks.observations.join("\n");
  }

  const sourcesUsed = [
    ...brain.facts.filter((f) => f.status === "verde").map((f) => f.id),
    ...brain.voice.map((v) => v.id),
  ];
  const pedidas = agent.needs.factKeys ?? [];
  const presentes = new Set(brain.facts.filter((f) => f.status === "verde").map((f) => f.key));
  const missingData = pedidas.filter((k) => !presentes.has(k));

  const runId = await hooks.recordRun?.({
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    agent_id: agent.id,
    pack: agent.pack,
    context_source: input.contextSource,
    input: { brief, needs: agent.needs },
    output: data,
    sources_used: sourcesUsed,
    missing_data: missingData,
    provider: meta.provider,
    model: meta.model,
    latency_ms: meta.latencyMs,
  });

  if (missingData.length) await hooks.recordGaps?.(input.workspaceId, missingData, agent.id);

  return { data, sourcesUsed, missingData, meta: { ...meta, runId }, checks };
}
