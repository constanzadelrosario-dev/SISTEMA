export type Provider = "anthropic" | "openai" | "lovable";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Clase de tarea. Decide el modelo: ver policy.ts. */
export type TaskClass =
  | "clasificacion" // etiquetar, enrutar, detectar. Barato.
  | "extraccion" // sacar estructura de texto. Barato.
  | "generacion" // producir la pieza. Caro.
  | "sintesis" // razonar sobre mucho contexto. Caro.
  | "evaluacion"; // revisar una pieza. Medio.

export type LlmOptions = {
  provider?: Provider;
  model?: string;
  task?: TaskClass;
  json?: boolean;
  temperature?: number;
  maxRetries?: number; // por defecto 2, backoff exponencial
  timeoutMs?: number; // por defecto 90_000
  cacheKey?: string; // reutiliza extracciones idénticas
};

export type LlmResult = {
  text: string;
  provider: Provider;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
  cached: boolean;
};
