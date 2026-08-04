import { z, type ZodType } from "zod";
import {
  LlmCreditsError, LlmError, LlmRateLimitError, LlmSchemaError, LlmTimeoutError,
} from "./errors";
import { defaultProvider, modelFor } from "./policy";
import type { LlmOptions, LlmResult, Message, Provider } from "./types";

const ENDPOINTS: Record<Provider, string> = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
};

const KEY_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  lovable: "LOVABLE_API_KEY",
};

const cache = new Map<string, LlmResult>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildBody(provider: Provider, model: string, messages: Message[], o: LlmOptions) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");
  if (provider === "anthropic") {
    return {
      model,
      max_tokens: 4096,
      temperature: o.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages: rest,
    };
  }
  return {
    model,
    temperature: o.temperature ?? 0.7,
    messages,
    ...(o.json ? { response_format: { type: "json_object" } } : {}),
  };
}

function readText(provider: Provider, data: unknown): string {
  const d = data as Record<string, unknown>;
  if (provider === "anthropic") {
    const blocks = (d.content ?? []) as Array<{ type: string; text?: string }>;
    return blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  }
  const choices = (d.choices ?? []) as Array<{ message?: { content?: string } }>;
  return (choices[0]?.message?.content ?? "").trim();
}

/** Cliente único. Ningún módulo llama a un endpoint de modelo por su cuenta. */
export async function callLlm(messages: Message[], opts: LlmOptions = {}): Promise<LlmResult> {
  if (opts.cacheKey && cache.has(opts.cacheKey)) {
    return { ...cache.get(opts.cacheKey)!, cached: true };
  }

  const provider = opts.provider ?? defaultProvider();
  const model = opts.model ?? modelFor(opts.task ?? "generacion", provider);
  const key = process.env[KEY_ENV[provider]];
  if (!key) throw new LlmError(`Falta ${KEY_ENV[provider]} en el entorno`);

  const maxRetries = opts.maxRetries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const started = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(ENDPOINTS[provider], {
        method: "POST",
        signal: ctrl.signal,
        headers:
          provider === "anthropic"
            ? { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
            : { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(buildBody(provider, model, messages, opts)),
      });
      clearTimeout(timer);

      if (res.status === 429) throw new LlmRateLimitError("Límite de uso alcanzado", 429);
      if (res.status === 402) throw new LlmCreditsError("Sin créditos en el proveedor", 402);
      if (!res.ok) throw new LlmError(`${provider} ${res.status}: ${(await res.text()).slice(0, 200)}`, res.status);

      const data = await res.json();
      const usage = (data.usage ?? {}) as Record<string, number>;
      const result: LlmResult = {
        text: readText(provider, data),
        provider,
        model,
        tokensIn: usage.input_tokens ?? usage.prompt_tokens,
        tokensOut: usage.output_tokens ?? usage.completion_tokens,
        latencyMs: Date.now() - started,
        cached: false,
      };
      if (opts.cacheKey) cache.set(opts.cacheKey, result);
      return result;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt === maxRetries) throw new LlmTimeoutError(`Timeout tras ${timeoutMs}ms`);
      } else if (err instanceof LlmCreditsError) {
        throw err; // reintentar no ayuda
      } else if (attempt === maxRetries) {
        throw err;
      }
      await sleep(2 ** attempt * 1000 + Math.random() * 500);
    }
  }
  throw new LlmError("Inalcanzable");
}

/** Extrae y valida JSON. Tolera vallas ```json y preámbulos. */
export async function callLlmJson<T>(
  messages: Message[],
  schema: ZodType<T>,
  opts: LlmOptions = {},
): Promise<{ data: T } & Omit<LlmResult, "text">> {
  const r = await callLlm(messages, { ...opts, json: true });
  const cleaned = r.text.replace(/```json|```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  const candidate = start >= 0 ? cleaned.slice(start) : cleaned;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new LlmSchemaError(`Salida no es JSON válido: ${cleaned.slice(0, 160)}`);
  }
  const check = schema.safeParse(parsed);
  if (!check.success) {
    throw new LlmSchemaError(`Salida no valida contra el esquema: ${check.error.message.slice(0, 200)}`);
  }
  const { text: _t, ...meta } = r;
  return { data: check.data, ...meta };
}

export { z };
