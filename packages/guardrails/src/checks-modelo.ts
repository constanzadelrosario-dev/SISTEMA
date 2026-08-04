import { callLlmJson, z } from "@sistema/core-llm";
import type { CheckResult, GuardContext } from "./types";

const Veredicto = z.object({
  passed: z.boolean(),
  detail: z.string(),
  suggestions: z.array(z.string()).default([]),
});

async function juzgar(
  id: "persuasion" | "crisis" | "compliance",
  system: string,
  texto: string,
  severity: "bloqueante" | "advertencia",
): Promise<CheckResult> {
  try {
    const { data } = await callLlmJson(
      [
        { role: "system", content: system },
        { role: "user", content: texto },
      ],
      Veredicto,
      { task: "evaluacion", temperature: 0 },
    );
    return {
      id,
      passed: data.passed,
      severity,
      detail: data.detail,
      suggestions: data.suggestions,
    };
  } catch (err) {
    // Un chequeo asistido que falla no debe bloquear en silencio ni dejar pasar
    // en silencio: se reporta como advertencia explícita.
    return {
      id,
      passed: true,
      severity: "advertencia",
      detail: `No se pudo ejecutar el chequeo: ${(err as Error).message}`,
    };
  }
}

/** 5 · PERSUASIÓN. Nunca bloquea; alimenta la revisión. */
export const chequeoPersuasion = (texto: string) =>
  juzgar(
    "persuasion",
    `Evalúa la fuerza persuasiva del texto contra Cialdini (autoridad, prueba social,
reciprocidad, escasez, consistencia, simpatía) y SUCCESs (simple, inesperado,
concreto, creíble, emocional, historia).
Devuelve SOLO JSON: { "passed": true, "detail": "1-2 frases", "suggestions": ["…"] }
passed es siempre true: este chequeo informa, no bloquea.
Marca urgencia artificial o escasez inventada como sugerencia de corrección.`,
    texto,
    "advertencia",
  );

/**
 * 6 · CRISIS. Bloqueante en dominio salud.
 * Exige derivación cuando la pieza toca crisis, y prohíbe prometer contención
 * clínica que el instrumento no entrega.
 */
export const chequeoCrisis = (texto: string, ctx: GuardContext) =>
  juzgar(
    "crisis",
    `Eres un revisor de seguridad de contenido en salud mental.
Determina si el texto (a) menciona ideación suicida, autolesión, violencia o crisis
aguda, y (b) si lo hace, incluye una vía de ayuda concreta.
Reglas:
- Si toca esos temas SIN ofrecer derivación, passed=false y sugiere incluir el bloque
  de derivación (en Chile: Salud Responde, Línea Libre, SENDA).
- Si promete contención, acompañamiento clínico o resultados terapéuticos que un
  instrumento en validación no entrega, passed=false.
- Si no toca esos temas, passed=true.
- No describas métodos ni des detalles de riesgo en tu respuesta.
Devuelve SOLO JSON: { "passed": bool, "detail": "…", "suggestions": ["…"] }`,
    texto,
    ctx.domain === "salud_mental" ? "bloqueante" : "advertencia",
  );

/** 7 · COMPLIANCE. Apagado por defecto: la plataforma es privada. */
export const chequeoCompliance = (texto: string) =>
  juzgar(
    "compliance",
    `Revisa tratamiento de datos personales de terceros, transparencia sobre el uso de
IA en la pieza, y afirmaciones publicitarias no sustentadas.
No cites artículos legales concretos: el marco vigente debe verificarse aparte.
Devuelve SOLO JSON: { "passed": bool, "detail": "…", "suggestions": ["…"] }`,
    texto,
    "bloqueante",
  );
