import type { ThemeTokens } from "../types";

/**
 * Ornamentos de esquina.
 *
 * Solo geometría: dos segmentos de línea en el tono de acento. No se importan
 * los activos gráficos de la marca de origen —las vides, las manos florecidas,
 * los marcos ilustrados— porque esos son obra ajena. Lo transferible es el
 * gesto: dónde va, de qué grosor y con qué opacidad.
 */
export function Ornaments({ t, scale = 1 }: { t: ThemeTokens; scale?: number }) {
  const o = t.ornaments;
  if (!o || o.corners === "ninguno") return null;

  const len = Math.round((o.corners === "marco" ? 180 : 96) * scale);
  const inset = Math.round(48 * scale);
  const w = Math.max(1, Math.round(scale));
  const line: React.CSSProperties = {
    position: "absolute",
    background: t.palette.accent,
    opacity: o.opacity,
  };

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ ...line, top: inset, left: inset, width: len, height: w }} />
      <div style={{ ...line, top: inset, left: inset, width: w, height: len }} />
      <div style={{ ...line, bottom: inset, right: inset, width: len, height: w }} />
      <div style={{ ...line, bottom: inset, right: inset, width: w, height: len }} />
    </div>
  );
}
