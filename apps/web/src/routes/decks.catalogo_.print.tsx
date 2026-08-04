import { DeckPrint, PRESETS } from "@sistema/deck";
import { createFileRoute } from "@tanstack/react-router";
import { DECK_CATALOGO } from "@/modules/decks/ejemplos";

/**
 * Imprimible del catálogo: los 14 layouts a 1920×1080, sin cromo. Es el objetivo
 * del chequeo de desborde del corte 5 (cada lámina debe caber en 1080).
 */
export const Route = createFileRoute("/decks/catalogo_/print")({
  validateSearch: (s: Record<string, unknown>): { tema: string } => ({
    tema: typeof s.tema === "string" ? s.tema : "editorial-oscuro",
  }),
  component: () => {
    const { tema } = Route.useSearch();
    const preset = PRESETS.find((p) => p.id === tema) ?? PRESETS[0];
    return <DeckPrint deck={DECK_CATALOGO} theme={preset.tokens} />;
  },
});
