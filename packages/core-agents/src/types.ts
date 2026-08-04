import type { ZodType } from "zod";
import type { LlmOptions } from "@sistema/core-llm";
import type { BrainSlice, GuardCheckId } from "./brain";

export type ContextSource = "brain" | "manual" | "mixed";

export type AgentInput<B = Record<string, unknown>> = {
  workspaceId: string;
  projectId?: string;
  brief: B;
  contextSource: ContextSource;
  brain?: BrainSlice;                  // resuelto desde la base
  manualContext?: Partial<BrainSlice>; // pegado en el formulario
  options?: LlmOptions;
};

export type AgentOutput<T> = {
  data: T;
  sourcesUsed: string[];   // ids de facts y voice efectivamente citados
  missingData: string[];   // claves que hicieron falta; se vuelven gaps
  meta: { provider: string; model: string; latencyMs: number; runId?: string };
};

export type AgentNeeds = {
  factKeys?: string[];
  voice?: boolean;
  citations?: boolean;
  commitments?: boolean;
  limits?: boolean;
};

export type AgentDef<B, T> = {
  id: string;                     // 'eje.pieza'
  pack: "eje" | "ads" | "voz" | "deck" | "marca" | "campus";
  label: string;
  task?: LlmOptions["task"];      // decide el modelo vía la política
  needs: AgentNeeds;
  briefSchema: ZodType<B>;
  outputSchema: ZodType<T>;
  system: (input: AgentInput<B>) => string;
  /** Texto sobre el que corren los guardrails. Por defecto, el JSON completo. */
  textForChecks?: (out: T) => string;
  extraChecks?: GuardCheckId[];
};
