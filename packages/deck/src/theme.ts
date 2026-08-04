import type { ThemeTokens } from "./types";

import { TEMA_EDITORIAL_OSCURO } from "./themes/presets";

/** El tema por defecto es el editorial oscuro: escala ya probada a 1920×1080. */
export const TEMA_BASE: ThemeTokens = TEMA_EDITORIAL_OSCURO;

export type VariationAxis =
  | "palette" | "fonts" | "density" | "ratio" | "accent" | "align" | "imagery";

/**
 * Alternativas a partir de una referencia.
 * No al azar: una variación mueve UN eje y mantiene el resto, para que se vea
 * qué causó la diferencia. La última va a propósito en dirección opuesta, para
 * que el sistema no se encierre en lo que ya te gusta.
 */
export function generarAlternativas(
  base: ThemeTokens,
  ejes: VariationAxis[] = ["fonts", "density"],
): Array<{ name: string; origin: "extraido" | "variacion" | "contraste"; tokens: ThemeTokens }> {
  const out: Array<{ name: string; origin: "extraido" | "variacion" | "contraste"; tokens: ThemeTokens }> = [
    { name: "Fiel a la referencia", origin: "extraido", tokens: base },
  ];

  for (const eje of ejes.slice(0, 2)) {
    const t: ThemeTokens = structuredClone(base);
    if (eje === "fonts") {
      t.fonts = { ...t.fonts, title: "Inter, sans-serif", body: "Inter, sans-serif" };
      out.push({ name: "Misma paleta, tipografía sans", origin: "variacion", tokens: t });
    } else if (eje === "density") {
      t.density = {
        padY: Math.round(t.density.padY * 0.7), padX: Math.round(t.density.padX * 0.7),
        padXLg: Math.round(t.density.padXLg * 0.7), lineHeight: 1.35,
      };
      out.push({ name: "Más compacto", origin: "variacion", tokens: t });
    } else if (eje === "accent") {
      t.accent = { frequency: "alta" };
      out.push({ name: "Acento frecuente", origin: "variacion", tokens: t });
    }
  }

  const contraste: ThemeTokens = structuredClone(base);
  const claro = esOscuro(base.palette.bg);
  contraste.palette = claro
    ? { bg: "#ffffff", fg: "#111111", accent: base.palette.accent, muted: "#737373", surface: "#f5f5f5" }
    : { bg: "#0a0a0a", fg: "#f5f0e8", accent: base.palette.accent, muted: "#9a9088", surface: "#141414" };
  contraste.align = base.align === "izquierda" ? "centrado" : "izquierda";
  out.push({ name: claro ? "Contraste claro" : "Contraste oscuro", origin: "contraste", tokens: contraste });

  return out;
}

function esOscuro(hex: string): boolean {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/** Emite el tema como variables CSS para el render de impresión. */
export const themeToCss = (t: ThemeTokens): string =>
  [
    `--bg:${t.palette.bg}`, `--fg:${t.palette.fg}`, `--accent:${t.palette.accent}`,
    `--muted:${t.palette.muted}`, `--surface:${t.palette.surface}`,
    `--f-title:${t.fonts.title}`, `--f-body:${t.fonts.body}`, `--f-ui:${t.fonts.ui}`,
    `--h1:${t.scale.h1}px`, `--h2:${t.scale.h2}px`, `--body:${t.scale.body}px`,
    `--pad-y:${t.density.padY}px`, `--pad-x:${t.density.padX}px`,
    `--pad-x-lg:${t.density.padXLg}px`, `--lh:${t.density.lineHeight}`,
    `--text-width:${Math.round(t.ratio.textWidth * 100)}%`,
  ].join(";");
