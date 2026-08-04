export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class LlmRateLimitError extends LlmError {} // 429
export class LlmCreditsError extends LlmError {} // 402
export class LlmTimeoutError extends LlmError {}
export class LlmSchemaError extends LlmError {} // salida no valida contra el esquema
