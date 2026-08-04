import { DECK_EJEMPLO, DeckPrint, PRESETS } from "@sistema/deck";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Imprimible del deck de ejemplo, sin cromo ni sidebar. El sufijo `_` en
 * `ejemplo_` desanida esta ruta del layout del mirador: `/decks/ejemplo/print`
 * se sirve sola. Playwright entra acá para generar el PDF nativo (texto
 * seleccionable, 1920×1080). El tema se elige por `?tema=<id>`.
 */
export const Route = createFileRoute("/decks/ejemplo_/print")({
  validateSearch: (s: Record<string, unknown>): { tema: string } => ({
    tema: typeof s.tema === "string" ? s.tema : "editorial-oscuro",
  }),
  component: () => {
    const { tema } = Route.useSearch();
    const preset = PRESETS.find((p) => p.id === tema) ?? PRESETS[0];
    return <DeckPrint deck={DECK_EJEMPLO} theme={preset.tokens} />;
  },
});
