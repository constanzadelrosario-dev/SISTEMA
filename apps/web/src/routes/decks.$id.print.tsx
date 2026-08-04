import { DeckPrint } from "@sistema/deck";
import { createFileRoute } from "@tanstack/react-router";
import { fnGetDeck } from "@/modules/decks/functions";

/**
 * Ruta de impresión, fuera del layout autenticado a propósito: no lleva cromo
 * ni barra lateral. Playwright entra acá para generar el PDF.
 */
export const Route = createFileRoute("/decks/$id/print")({
  loader: ({ params }) => fnGetDeck({ data: { id: params.id } }),
  component: () => {
    const { deck, theme } = Route.useLoaderData();
    return <DeckPrint deck={deck} theme={theme} />;
  },
});
