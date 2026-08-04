import type { Provider, TaskClass } from "./types";

/**
 * Política de modelos por clase de tarea.
 * Regla: lo barato para clasificar y extraer, lo caro solo para generar y sintetizar.
 * Cambiar acá afecta a todo el sistema; ningún agente elige modelo por su cuenta
 * salvo que declare un motivo.
 */
export const MODEL_POLICY: Record<TaskClass, Record<Provider, string>> = {
  clasificacion: {
    anthropic: "claude-haiku-4-5-20251001",
    openai: "gpt-4o-mini",
    lovable: "google/gemini-3-flash-preview",
  },
  extraccion: {
    anthropic: "claude-haiku-4-5-20251001",
    openai: "gpt-4o-mini",
    lovable: "google/gemini-3-flash-preview",
  },
  evaluacion: {
    anthropic: "claude-sonnet-5",
    openai: "gpt-4o",
    lovable: "google/gemini-3-flash-preview",
  },
  generacion: {
    anthropic: "claude-sonnet-5",
    openai: "gpt-4o",
    lovable: "google/gemini-3-flash-preview",
  },
  sintesis: {
    anthropic: "claude-opus-5",
    openai: "gpt-4o",
    lovable: "google/gemini-3-flash-preview",
  },
};

export const defaultProvider = (): Provider =>
  (process.env.LLM_PROVIDER as Provider) ?? "anthropic";

export const modelFor = (task: TaskClass, provider: Provider): string =>
  MODEL_POLICY[task][provider];
