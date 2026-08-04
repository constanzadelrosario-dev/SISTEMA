export type { BrainSlice, CheckId as GuardCheckId } from "@sistema/guardrails";

import type { BrainSlice } from "@sistema/guardrails";
import type { AgentNeeds } from "./types";

export const emptyBrain = (): BrainSlice => ({
  facts: [],
  voice: [],
  citations: [],
  gaps: [],
  commitments: [],
  limits: [],
});

/** Fusiona el contexto de la base con lo pegado a mano. Lo manual gana. */
export function mergeBrain(base: BrainSlice, manual?: Partial<BrainSlice>): BrainSlice {
  if (!manual) return base;
  return {
    facts: [...base.facts, ...(manual.facts ?? [])],
    voice: [...base.voice, ...(manual.voice ?? [])],
    citations: [...base.citations, ...(manual.citations ?? [])],
    gaps: [...base.gaps, ...(manual.gaps ?? [])],
    commitments: [...base.commitments, ...(manual.commitments ?? [])],
    limits: [...(base.limits ?? []), ...(manual.limits ?? [])],
  };
}

/** Entrega solo la rebanada que el agente declaró necesitar. */
export function sliceBrain(brain: BrainSlice, needs: AgentNeeds): BrainSlice {
  return {
    facts: needs.factKeys?.length
      ? brain.facts.filter((f) =>
          needs.factKeys!.some((k) => f.key === k || f.key.startsWith(`${k}.`)),
        )
      : brain.facts,
    voice: needs.voice ? brain.voice : [],
    citations: needs.citations ? brain.citations : [],
    commitments: needs.commitments ? brain.commitments : [],
    limits: needs.limits ? (brain.limits ?? []) : [],
    gaps: brain.gaps,
  };
}

/** Serializa el contexto para el prompt. Solo entra lo verde. */
export function renderBrain(brain: BrainSlice): string {
  const verdes = brain.facts.filter((f) => f.status === "verde");
  const partes: string[] = [];
  if (verdes.length) {
    partes.push(
      `HECHOS CONFIRMADOS (los únicos citables):\n${verdes.map((f) => `- ${f.key}: ${f.value}`).join("\n")}`,
    );
  }
  const amarillos = brain.facts.filter((f) => f.status !== "verde");
  if (amarillos.length) {
    partes.push(
      `NO CONFIRMADOS (no los uses como dato duro):\n${amarillos.map((f) => `- ${f.key}`).join("\n")}`,
    );
  }
  if (brain.voice.length) {
    partes.push(
      `VOZ TEXTUAL (únicas frases que puedes entrecomillar como suyas):\n${brain.voice.map((v) => `- "${v.text}"`).join("\n")}`,
    );
  }
  if (brain.commitments.length) {
    partes.push(
      `COMPROMISOS:\n${brain.commitments.map((c) => `- ${c.promise}${c.dueDate ? ` (${c.dueDate})` : ""}`).join("\n")}`,
    );
  }
  if (brain.limits?.length) {
    partes.push(
      `LÍMITES NARRATIVOS (no los abordes):\n${brain.limits
        .filter((l) => l.level !== "publico")
        .map((l) => `- ${l.topic}`)
        .join("\n")}`,
    );
  }
  return partes.join("\n\n");
}
