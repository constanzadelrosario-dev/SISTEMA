export type CheckId =
  | "validacion"
  | "verbatim"
  | "coherencia"
  | "limites" // duros
  | "persuasion"
  | "crisis"
  | "compliance"; // asistidos por modelo

export type Severity = "bloqueante" | "advertencia" | "off";

export type Span = { start: number; end: number; text: string };

export type CheckResult = {
  id: CheckId;
  passed: boolean;
  severity: Severity;
  detail: string;
  spans?: Span[];
  suggestions?: string[];
};

export type BrainSlice = {
  facts: Array<{
    id: string;
    key: string;
    value: string | null;
    status: "verde" | "amarillo" | "rojo";
  }>;
  voice: Array<{ id: string; text: string; speaker: string }>;
  citations: Array<{ id: string; text: string; attribution: string }>;
  gaps: Array<{ field: string; priority: number }>;
  commitments: Array<{ promise: string; dueDate: string | null }>;
  limits?: Array<{ topic: string; level: "nunca" | "cerrado" | "publico" }>;
};

export type GuardContext = {
  brain: BrainSlice;
  domain: "salud_mental" | "comercial" | "academico" | "general";
  speaker?: string;
};

export type GuardrailProfile = {
  id: string;
  name: string;
  checks: Record<CheckId, Severity>;
};

export type GuardVerdict = {
  results: CheckResult[];
  blocked: boolean;
  observations: string[]; // se pasan al modelo en el reintento
};
