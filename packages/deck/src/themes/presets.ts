import type { ThemeTokens } from "../types";

/**
 * Temas extraídos de decks reales ya producidos.
 *
 * Se toman TOKENS, nunca activos: paleta, tipografía, escala, densidad,
 * proporción y geometría de ornamento. Las fotografías, ilustraciones,
 * logotipos, vides y manos florecidas pertenecen a la identidad de origen y no
 * se copian ni se guardan.
 *
 * Nota de tipografía: los presets usan solo fuentes de licencia abierta.
 * El deck de Madden referencia Acumin Pro (Adobe Typekit, licenciada) y ya cae
 * a Barlow en producción; acá se declara Barlow directamente para que el tema
 * funcione sin kit.
 */

/** Editorial oscuro. Origen: deck Anotherland, 21 láminas a 1920×1080. */
export const TEMA_EDITORIAL_OSCURO: ThemeTokens = {
  palette: {
    bg: "#0a0a0a",
    fg: "#f5f0e8",
    accent: "#c8a96e",
    muted: "#9a9088",
    surface: "#141414",
  },
  fonts: {
    title: '"Baskervville", Georgia, serif',
    body: '"Cormorant Garamond", Garamond, serif',
    ui: '"Inter", system-ui, sans-serif',
  },
  scale: { h1: 96, h2: 64, body: 22, caption: 13 },
  density: { padY: 96, padX: 96, padXLg: 120, lineHeight: 1.55 },
  ratio: { textWidth: 0.48 },
  accent: { frequency: "rara" },
  align: "izquierda",
  imagery: "sangre",
  ornaments: { corners: "linea", opacity: 0.25 },
};

/** Editorial contrastado, energía de calle. Origen: propuesta Madden Home. */
export const TEMA_EDITORIAL_CONTRASTADO: ThemeTokens = {
  palette: {
    bg: "#ffffff",
    fg: "#000000",
    accent: "#ffcc00",
    muted: "#737373",
    surface: "#f5f5f5",
  },
  fonts: {
    title: '"Barlow Condensed", system-ui, sans-serif',
    body: '"Barlow", system-ui, sans-serif',
    ui: '"Barlow Condensed", system-ui, sans-serif',
  },
  // Display extra-condensado: soporta un cuerpo mayor sin romper la lámina.
  scale: { h1: 118, h2: 76, body: 20, caption: 12 },
  density: { padY: 96, padX: 80, padXLg: 112, lineHeight: 1.6 },
  ratio: { textWidth: 0.52 },
  accent: { frequency: "media" },
  align: "izquierda",
  imagery: "sangre",
  ornaments: { corners: "ninguno", opacity: 0 },
};

/** Variante nocturna del anterior, para láminas de apertura y divisores. */
export const TEMA_CONTRASTADO_NOCHE: ThemeTokens = {
  ...TEMA_EDITORIAL_CONTRASTADO,
  palette: {
    bg: "#000000",
    fg: "#ffffff",
    accent: "#ffcc00",
    muted: "#a3a3a3",
    surface: "#171717",
  },
};

/**
 * Cálido clínico. No sale de ningún repo: es el contraste deliberado para que
 * la biblioteca no quede encerrada en dos registros editoriales, y el registro
 * más plausible para material académico o institucional.
 */
export const TEMA_CALIDO_CLINICO: ThemeTokens = {
  palette: {
    bg: "#f4efe6",
    fg: "#1c2b26",
    accent: "#0f6e56",
    muted: "#6b7a74",
    surface: "#ffffff",
  },
  fonts: {
    title: 'Georgia, "Times New Roman", serif',
    body: '"Inter", system-ui, sans-serif',
    ui: '"Inter", system-ui, sans-serif',
  },
  scale: { h1: 78, h2: 54, body: 22, caption: 13 },
  density: { padY: 104, padX: 104, padXLg: 128, lineHeight: 1.7 },
  ratio: { textWidth: 0.5 },
  accent: { frequency: "rara" },
  align: "izquierda",
  imagery: "recuadro",
  ornaments: { corners: "ninguno", opacity: 0 },
};

export const PRESETS = [
  { id: "editorial-oscuro", name: "Editorial oscuro", tokens: TEMA_EDITORIAL_OSCURO },
  {
    id: "editorial-contrastado",
    name: "Editorial contrastado",
    tokens: TEMA_EDITORIAL_CONTRASTADO,
  },
  { id: "contrastado-noche", name: "Contrastado noche", tokens: TEMA_CONTRASTADO_NOCHE },
  { id: "calido-clinico", name: "Cálido clínico", tokens: TEMA_CALIDO_CLINICO },
] as const;

/** Fuentes que hay que cargar. Todas de licencia abierta. */
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Baskervville:ital@0;1" +
  "&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400" +
  "&family=Barlow:wght@300;400;500;700" +
  "&family=Barlow+Condensed:wght@400;500;700;900" +
  "&family=Inter:wght@300;400;500" +
  "&display=swap";
