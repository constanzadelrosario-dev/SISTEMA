import { chequeoCoherencia, chequeoLimites, chequeoValidacion, chequeoVerbatim } from "./checks-duros";
import { chequeoCompliance, chequeoCrisis, chequeoPersuasion } from "./checks-modelo";
import type { CheckId, CheckResult, GuardContext, GuardVerdict, GuardrailProfile } from "./types";

export const PERFIL_CLINICO: GuardrailProfile = {
  id: "clinico", name: "Clínico",
  checks: { validacion: "bloqueante", verbatim: "bloqueante", coherencia: "advertencia",
            limites: "advertencia", persuasion: "advertencia", crisis: "bloqueante", compliance: "off" },
};

export const PERFIL_ARRANQUE: GuardrailProfile = {
  id: "arranque", name: "Arranque",
  checks: { validacion: "advertencia", verbatim: "off", coherencia: "off",
            limites: "advertencia", persuasion: "off", crisis: "bloqueante", compliance: "off" },
};

export const PERFIL_LIBRE: GuardrailProfile = {
  id: "libre", name: "Libre",
  checks: { validacion: "off", verbatim: "off", coherencia: "off",
            limites: "off", persuasion: "off", crisis: "off", compliance: "off" },
};

const DUROS: CheckId[] = ["validacion", "verbatim", "coherencia", "limites"];

/**
 * Ejecuta los chequeos activos según el perfil.
 * Los duros corren primero y sin costo. Si alguno bloquea, los asistidos no se
 * ejecutan: no tiene sentido gastar tokens puntuando un texto ya descartado.
 * La severidad final la fija el perfil, no el chequeo.
 */
export async function runChecks(
  texto: string,
  ctx: GuardContext,
  profile: GuardrailProfile,
): Promise<GuardVerdict> {
  const activo = (id: CheckId) => (profile.checks[id] ?? "off") !== "off";
  const sev = (id: CheckId) => profile.checks[id];
  const aplicar = (r: CheckResult): CheckResult => ({ ...r, severity: sev(r.id) });

  const results: CheckResult[] = [];

  if (activo("validacion")) results.push(aplicar(chequeoValidacion(texto, ctx)));
  if (activo("verbatim"))   results.push(aplicar(chequeoVerbatim(texto, ctx)));
  if (activo("coherencia")) results.push(aplicar(chequeoCoherencia(texto, ctx)));
  if (activo("limites"))    results.push(aplicar(chequeoLimites(texto, ctx)));

  const duroBloqueado = results.some(
    (r) => !r.passed && r.severity === "bloqueante" && DUROS.includes(r.id),
  );

  if (!duroBloqueado) {
    const asistidos = await Promise.all([
      activo("persuasion") ? chequeoPersuasion(texto) : null,
      activo("crisis") ? chequeoCrisis(texto, ctx) : null,
      activo("compliance") ? chequeoCompliance(texto) : null,
    ]);
    for (const r of asistidos) if (r) results.push(aplicar(r));
  }

  const blocked = results.some((r) => !r.passed && r.severity === "bloqueante");
  const observations = results
    .filter((r) => !r.passed)
    .map((r) => `[${r.id}] ${r.detail}${r.suggestions?.length ? ` Sugerencias: ${r.suggestions.join(" ")}` : ""}`);

  return { results, blocked, observations };
}
