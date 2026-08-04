import { describe, expect, it } from "vitest";
import { chequeoCoherencia, chequeoLimites, chequeoValidacion, chequeoVerbatim } from "../src/checks-duros";
import type { BrainSlice, GuardContext } from "../src/types";

const brain = (over: Partial<BrainSlice> = {}): BrainSlice => ({
  facts: [], voice: [], citations: [], gaps: [], commitments: [], limits: [], ...over,
});
const ctx = (b: BrainSlice): GuardContext => ({ brain: b, domain: "salud_mental", speaker: "principal" });

describe("validación", () => {
  it("bloquea lenguaje de eficacia si el instrumento no está en verde", () => {
    const r = chequeoValidacion("Es un instrumento validado y con eficacia clínica.", ctx(brain()));
    expect(r.passed).toBe(false);
    expect(r.spans?.length).toBeGreaterThan(0);
  });

  it("REGRESIÓN: la negación no dispara falso positivo", () => {
    // El motor original comparaba por substring: "no está validado" contenía
    // "validado" y se bloqueaba, siendo la redacción correcta.
    const r = chequeoValidacion("El instrumento no está validado todavía.", ctx(brain()));
    expect(r.passed).toBe(true);
  });

  it("permite el lenguaje cuando el hecho está en verde", () => {
    const b = brain({ facts: [{ id: "1", key: "instrumento.validacion", value: "sí", status: "verde" }] });
    expect(chequeoValidacion("Instrumento validado.", ctx(b)).passed).toBe(true);
  });
});

describe("verbatim", () => {
  it("bloquea una cita propia que no existe en voice", () => {
    const r = chequeoVerbatim('Como digo siempre: "esto lo inventó el modelo".', ctx(brain()));
    expect(r.passed).toBe(false);
  });

  it("acepta la cita que sí existe", () => {
    const b = brain({ voice: [{ id: "v1", speaker: "principal", text: "nadie las estaba escuchando" }] });
    expect(chequeoVerbatim('Dije: "nadie las estaba escuchando".', ctx(b)).passed).toBe(true);
  });

  it("REGRESIÓN: una cita atribuida a un tercero no se marca como inventada", () => {
    const r = chequeoVerbatim('Según Kahneman, "pensamos más rápido de lo que creemos".', ctx(brain()));
    expect(r.passed).toBe(true);
    expect(r.severity).toBe("advertencia");
  });
});

describe("coherencia", () => {
  it("marca fechas que no figuran en compromisos", () => {
    const b = brain({ commitments: [{ promise: "entregar el piloto", dueDate: "2026-09-01" }] });
    const r = chequeoCoherencia("Lo entregamos el 2026-12-15.", ctx(b));
    expect(r.passed).toBe(false);
  });
});

describe("límites narrativos", () => {
  it("avisa cuando la pieza cruza un límite declarado", () => {
    const b = brain({ limits: [{ topic: "terapia", level: "nunca" }] });
    const r = chequeoLimites("Hablemos de mi propia terapia.", ctx(b));
    expect(r.passed).toBe(false);
  });

  it("no chequea nada si no se corrió la fase 0", () => {
    expect(chequeoLimites("Cualquier cosa.", ctx(brain())).passed).toBe(true);
  });
});
