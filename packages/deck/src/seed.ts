import type { Deck } from "./types";

/**
 * Deck de ejemplo. Existe para que el renderizador se pueda ver funcionando
 * el primer día, antes de que haya base de datos, temas o agentes.
 */
export const DECK_EJEMPLO: Deck = {
  meta: {
    title: "Deck de ejemplo",
    lang: "es",
    aspect: "16:9",
    confidential: true,
  },
  slides: [
    {
      layout: "cover",
      kicker: "Ejemplo",
      title: "Medir lo que nadie mide",
      subtitle: "Un instrumento en fase de validación para una brecha documentada.",
    },
    { layout: "statement", text: "El problema no es la falta de datos. Es que nadie los recoge." },
    {
      layout: "kpi-grid",
      title: "Dónde estamos",
      items: [
        { value: "312", label: "participantes piloto" },
        { value: "7", label: "instituciones" },
        { value: "18 m", label: "de trabajo de campo" },
      ],
    },
    {
      layout: "timeline",
      title: "Ruta",
      phases: [
        { label: "Fase 1", items: ["Construcción de ítems", "Juicio de expertos"] },
        { label: "Fase 2", items: ["Aplicación piloto", "Análisis psicométrico"] },
        { label: "Fase 3", items: ["Baremos", "Publicación"] },
      ],
    },
    {
      layout: "table",
      title: "Inversión",
      head: ["Concepto", "Detalle", "Monto"],
      rows: [
        ["Trabajo de campo", "3 regiones", "$0.000.000"],
        ["Análisis", "Psicometría y baremos", "$0.000.000"],
      ],
      total: { label: "Total", value: "$0.000.000" },
    },
    { layout: "credits", lines: ["Preparado por", "Contacto"] },
  ],
};
