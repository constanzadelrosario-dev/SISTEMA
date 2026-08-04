/** Normaliza para comparar: minúsculas y sin diacríticos. */
export const norm = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Coincidencia por palabra completa, no por substring. */
export function findWord(haystack: string, needle: string): number[] {
  const h = norm(haystack);
  const n = norm(needle);
  const out: number[] = [];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
  for (const m of h.matchAll(re)) if (m.index !== undefined) out.push(m.index);
  return out;
}

const NEGADORES = [
  "no", "aun no", "aún no", "todavia no", "todavía no", "sin", "nunca",
  "en fase de", "pendiente de", "en proceso de", "antes de", "falta",
];

/**
 * ¿El término está negado?
 * Corrige el falso positivo del motor original: "no está validado" contenía
 * "validado" y se bloqueaba, siendo justamente la redacción correcta.
 */
export function estaNegado(texto: string, posicion: number, ventana = 60): boolean {
  const antes = norm(texto.slice(Math.max(0, posicion - ventana), posicion));
  return NEGADORES.some((neg) => new RegExp(`(?<![\\p{L}])${neg}(?![\\p{L}])`, "u").test(antes));
}

/** Extrae frases entrecomilladas, rectas y tipográficas, con su posición. */
export function extraerCitas(texto: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = [];
  for (const m of texto.matchAll(/["“«]([^"”»]{3,})["”»]/g)) {
    if (m.index === undefined) continue;
    out.push({ text: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * ¿La cita lleva atribución explícita a un tercero?
 * Sin esta distinción el chequeo de verbatim marca como inventadas las citas
 * legítimas de autores, papers y entrevistados, y se vuelve tan ruidoso que
 * se termina apagando.
 */
export function tieneAtribucionExterna(texto: string, start: number, end: number): boolean {
  const ctx = norm(texto.slice(Math.max(0, start - 120), Math.min(texto.length, end + 120)));
  return /(seg[uú]n|de acuerdo a|como (dijo|escribi[oó]|se[nñ]al[oó]|plantea|sostiene)|en palabras de|cit(a|ando) a|\(\s*\d{4}\s*\))/u.test(ctx);
}
