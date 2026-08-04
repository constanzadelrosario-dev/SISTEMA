import type { CheckResult, GuardContext, Span } from "./types";
import { estaNegado, extraerCitas, findWord, norm, tieneAtribucionExterna } from "./util";

/** Léxico de eficacia clínica. Bloqueado si el instrumento no está validado. */
const TERMINOS_EFICACIA = [
  "validado", "validada", "eficacia clinica", "eficacia terapeutica",
  "tratamiento", "diagnostico", "cura", "curar", "curativo",
  "evidencia clinica", "instrumento validado", "psicometricamente validado",
  "clinicamente probado", "terapeutico",
];

/**
 * 1 · VALIDACIÓN (duro)
 * Si el hecho instrumento.validacion no está en verde, prohíbe el lenguaje de
 * eficacia. Respeta la negación: "no está validado" es la redacción correcta
 * y debe pasar.
 */
export function chequeoValidacion(texto: string, ctx: GuardContext): CheckResult {
  const hecho = ctx.brain.facts.find((f) => f.key === "instrumento.validacion");
  const validado = hecho?.status === "verde";

  if (validado) {
    return { id: "validacion", passed: true, severity: "bloqueante",
      detail: "Validación confirmada: el lenguaje de eficacia está permitido." };
  }

  const spans: Span[] = [];
  for (const termino of TERMINOS_EFICACIA) {
    for (const pos of findWord(texto, termino)) {
      if (estaNegado(texto, pos)) continue;
      spans.push({ start: pos, end: pos + termino.length, text: texto.slice(pos, pos + termino.length) });
    }
  }

  if (spans.length === 0) {
    return { id: "validacion", passed: true, severity: "bloqueante",
      detail: "Sin lenguaje de eficacia clínica no negado." };
  }
  return {
    id: "validacion", passed: false, severity: "bloqueante",
    detail: `Validación no confirmada. Lenguaje de eficacia: ${spans.map((s) => s.text).join(", ")}.`,
    spans,
    suggestions: [
      "Usa 'instrumento en fase de validación', 'piloto' o 'en construcción'.",
      "Evita validado, eficacia, tratamiento, diagnóstico y cura sin negación.",
    ],
  };
}

/**
 * 2 · VERBATIM (duro)
 * Toda cita atribuida a la persona debe existir en `voice`.
 * Las citas con atribución explícita a un tercero se verifican contra
 * `citations`; si no están registradas, se marcan como advertencia, no como
 * invención.
 */
export function chequeoVerbatim(texto: string, ctx: GuardContext): CheckResult {
  const citas = extraerCitas(texto);
  if (citas.length === 0) {
    return { id: "verbatim", passed: true, severity: "bloqueante", detail: "No hay citas que verificar." };
  }

  const speaker = ctx.speaker ?? "principal";
  const voz = ctx.brain.voice.filter((v) => v.speaker === speaker).map((v) => norm(v.text));
  const terceros = ctx.brain.citations.map((c) => norm(c.text));

  const inventadas: Span[] = [];
  const sinRegistrar: Span[] = [];

  for (const cita of citas) {
    const c = norm(cita.text);
    const externa = tieneAtribucionExterna(texto, cita.start, cita.end);
    const banco = externa ? terceros : voz;
    const existe = banco.some((v) => v.includes(c) || c.includes(v));
    if (existe) continue;
    (externa ? sinRegistrar : inventadas).push({ start: cita.start, end: cita.end, text: cita.text });
  }

  if (inventadas.length === 0 && sinRegistrar.length === 0) {
    return { id: "verbatim", passed: true, severity: "bloqueante",
      detail: `${citas.length} cita(s) verificada(s).` };
  }
  if (inventadas.length === 0) {
    return { id: "verbatim", passed: true, severity: "advertencia",
      detail: `${sinRegistrar.length} cita(s) de terceros sin registrar en citations.`,
      spans: sinRegistrar,
      suggestions: ["Registra la cita con su fuente y URL, o parafrasea."] };
  }
  return {
    id: "verbatim", passed: false, severity: "bloqueante",
    detail: `Citas atribuidas a ti que no existen en tu voz: ${inventadas.map((s) => `"${s.text.slice(0, 50)}…"`).join(" · ")}`,
    spans: inventadas,
    suggestions: ["Carga la frase textual en voice, o elimina las comillas y parafrasea."],
  };
}

/**
 * 3 · COHERENCIA (duro, advertencia)
 * Marca fechas de la pieza que no corresponden a ningún compromiso registrado.
 */
export function chequeoCoherencia(texto: string, ctx: GuardContext): CheckResult {
  if (ctx.brain.commitments.length === 0) {
    return { id: "coherencia", passed: true, severity: "advertencia", detail: "Sin compromisos registrados." };
  }
  const fechas = [...texto.matchAll(/\b(20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})\b/g)];
  const conocidas = ctx.brain.commitments.map((c) => c.dueDate).filter(Boolean) as string[];

  const sospechosas: Span[] = fechas
    .filter((m) => !conocidas.some((f) => f.includes(m[1]) || m[1].includes(f)))
    .map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[1].length, text: m[1] }));

  if (sospechosas.length === 0) {
    return { id: "coherencia", passed: true, severity: "advertencia", detail: "Sin fechas en conflicto." };
  }
  return {
    id: "coherencia", passed: false, severity: "advertencia",
    detail: `Fechas que no figuran en compromisos: ${sospechosas.map((s) => s.text).join(", ")}.`,
    spans: sospechosas,
    suggestions: ["Verifica las fechas o registra el compromiso correspondiente."],
  };
}

/**
 * 4 · LÍMITES NARRATIVOS (duro, advertencia por defecto)
 * Chequea contra la lista declarada en la fase 0. No censura temas: hace que
 * la decisión de cruzar un límite sea consciente y no producto de la inercia.
 */
export function chequeoLimites(texto: string, ctx: GuardContext): CheckResult {
  const limites = ctx.brain.limits ?? [];
  if (limites.length === 0) {
    return { id: "limites", passed: true, severity: "advertencia",
      detail: "Sin límites narrativos declarados. Córrelos en la fase 0." };
  }
  const spans: Span[] = [];
  const cruzados: string[] = [];
  for (const l of limites.filter((x) => x.level !== "publico")) {
    for (const pos of findWord(texto, l.topic)) {
      spans.push({ start: pos, end: pos + l.topic.length, text: l.topic });
      if (!cruzados.includes(l.topic)) cruzados.push(l.topic);
    }
  }
  if (spans.length === 0) {
    return { id: "limites", passed: true, severity: "advertencia", detail: "No cruza límites declarados." };
  }
  return {
    id: "limites", passed: false, severity: "advertencia",
    detail: `Toca temas que marcaste como fuera de lo público: ${cruzados.join(", ")}.`,
    spans,
    suggestions: ["Revisa si quieres publicarlo, o ajusta el límite en la fase 0 si cambió."],
  };
}
