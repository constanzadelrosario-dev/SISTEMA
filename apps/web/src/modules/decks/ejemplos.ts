import type { Slide } from "@sistema/deck";

/**
 * Un ejemplo por cada uno de los 14 layouts del catálogo. Sirve para dos cosas:
 * el catálogo visual (ver todos los layouts a 1920×1080) y los valores por
 * defecto al agregar una lámina en el editor. Contenido del dominio de origen
 * (un instrumento psicométrico en validación), no relleno genérico.
 */

/** Placeholder de imagen: SVG inline, sin activos externos ni de terceros. */
export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>` +
      `<rect width='100%' height='100%' fill='#d9d4cc'/>` +
      `<text x='50%' y='50%' font-family='sans-serif' font-size='26' fill='#8a8378' ` +
      `text-anchor='middle' dominant-baseline='middle'>imagen</text></svg>`,
  );

const img = { src: PLACEHOLDER_IMG, alt: "Imagen de ejemplo" };

/** Orden del catálogo. Es el orden en que se ofrecen al agregar una lámina. */
export const LAYOUTS = [
  "cover",
  "statement",
  "split",
  "kpi-grid",
  "timeline",
  "agenda",
  "steps",
  "table",
  "qty-list",
  "grid",
  "quote",
  "fullbleed",
  "divider",
  "credits",
] as const;

export type LayoutName = (typeof LAYOUTS)[number];

export const EJEMPLO_LAYOUT: Record<LayoutName, Slide> = {
  cover: {
    layout: "cover",
    kicker: "Propuesta",
    title: "Medir lo que nadie mide",
    subtitle: "Un instrumento en fase de validación para una brecha documentada.",
  },
  statement: {
    layout: "statement",
    text: "El problema no es la falta de datos. Es que nadie los recoge.",
    attribution: "Tesis del proyecto",
  },
  split: {
    layout: "split",
    side: "right",
    kicker: "Qué es",
    title: "Un instrumento, no un test más",
    body: "Diseñado para poblaciones que los inventarios existentes dejan fuera.",
    bullets: ["Ítems construidos, no traducidos", "Baremos locales", "Perfil no patologizante"],
    image: img,
  },
  "kpi-grid": {
    layout: "kpi-grid",
    title: "Dónde estamos",
    items: [
      { value: "312", label: "participantes piloto" },
      { value: "7", label: "instituciones" },
      { value: "18 m", label: "de trabajo de campo" },
    ],
  },
  timeline: {
    layout: "timeline",
    title: "Ruta de validación",
    phases: [
      { label: "Fase 1", items: ["Construcción de ítems", "Juicio de expertos"] },
      { label: "Fase 2", items: ["Aplicación piloto", "Análisis psicométrico"] },
      { label: "Fase 3", items: ["Baremos", "Publicación"] },
    ],
  },
  agenda: {
    layout: "agenda",
    title: "Agenda",
    part: "Sesión de trabajo",
    rows: [
      { time: "10:00", title: "El problema", desc: "Qué mide y qué no la oferta actual" },
      { time: "10:20", title: "El instrumento", desc: "Construcción y estado de validación" },
      { time: "10:45", title: "Siguientes pasos", desc: "Qué se necesita para cerrar" },
    ],
  },
  steps: {
    layout: "steps",
    title: "Cómo se aplica",
    steps: [
      { num: "01", name: "Consentimiento", desc: "Informado y voluntario" },
      { num: "02", name: "Aplicación", desc: "Autoadministrada, 12 minutos" },
      { num: "03", name: "Perfil", desc: "Devolución no patologizante" },
    ],
  },
  table: {
    layout: "table",
    title: "Inversión",
    head: ["Concepto", "Detalle", "Monto"],
    rows: [
      ["Trabajo de campo", "3 regiones", "$0.000.000"],
      ["Análisis", "Psicometría y baremos", "$0.000.000"],
    ],
    total: { label: "Total", value: "$0.000.000" },
  },
  "qty-list": {
    layout: "qty-list",
    title: "Qué incluye",
    items: [
      { qty: "1", label: "Manual técnico del instrumento" },
      { qty: "3", label: "Talleres de aplicación" },
      { qty: "∞", label: "Actualización de baremos" },
    ],
  },
  grid: {
    layout: "grid",
    title: "Dimensiones",
    cols: 3,
    cells: [
      { title: "Regulación", caption: "Manejo del malestar" },
      { title: "Vínculo", caption: "Apoyo percibido" },
      { title: "Sentido", caption: "Propósito y dirección" },
    ],
  },
  quote: {
    layout: "quote",
    text: "Por primera vez sentí que la pregunta era sobre mí, no sobre un manual.",
    author: "Participante piloto",
    role: "Región de Valparaíso",
  },
  fullbleed: {
    layout: "fullbleed",
    title: "Del campo al dato",
    body: "18 meses de trabajo en terreno.",
    image: img,
    overlay: 0.45,
  },
  divider: {
    layout: "divider",
    label: "Parte II · La evidencia",
  },
  credits: {
    layout: "credits",
    lines: ["Preparado por el equipo del proyecto", "Contacto: proyecto@ejemplo.cl"],
  },
};

/** Devuelve una copia fresca del ejemplo de un layout (para agregar láminas). */
export const nuevaLamina = (layout: LayoutName): Slide => structuredClone(EJEMPLO_LAYOUT[layout]);

/** Deck con los 14 layouts, en orden. Para el catálogo y el chequeo de desborde. */
export const DECK_CATALOGO = {
  meta: {
    title: "Catálogo de layouts",
    lang: "es" as const,
    aspect: "16:9" as const,
    confidential: true,
  },
  slides: LAYOUTS.map((l) => structuredClone(EJEMPLO_LAYOUT[l])),
};
