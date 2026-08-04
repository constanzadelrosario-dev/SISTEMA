import { DeckPrint, PRESETS } from "@sistema/deck";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Imprimible del deck del taller. Lee el deck de localStorage (por eso es
 * solo-cliente: el servidor no tiene ese estado) y lo renderiza en HTML nativo,
 * 1920×1080, sin cromo. El botón flotante (clase `no-print`) desaparece en el
 * PDF: "Guardar como PDF" desde el navegador conserva el texto seleccionable.
 *
 * El sufijo `_` en `taller_` desanida esta ruta del layout del editor.
 */
export const Route = createFileRoute("/decks/taller_/print")({
  validateSearch: (s: Record<string, unknown>): { tema: string } => ({
    tema: typeof s.tema === "string" ? s.tema : "editorial-oscuro",
  }),
  component: Imprimible,
});

const CLAVE = "sistema.deck.taller";

// biome-ignore lint/suspicious/noExplicitAny: el deck local es un subconjunto del tipo Deck
type DeckAny = any;

function Imprimible() {
  const { tema } = Route.useSearch();
  const [deck, setDeck] = useState<DeckAny | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) setDeck(JSON.parse(raw));
    } catch {}
    setListo(true);
  }, []);

  const preset = PRESETS.find((p) => p.id === tema) ?? PRESETS[0];

  if (!listo) return null;
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        No hay un deck guardado en este navegador. Vuelve al taller, arma tu deck y guárdalo.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="no-print"
        onClick={() => window.print()}
        style={{
          position: "fixed",
          right: 16,
          top: 16,
          zIndex: 100,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "#111",
          color: "#fff",
          fontFamily: "system-ui",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Imprimir / Guardar como PDF
      </button>
      <DeckPrint deck={deck} theme={preset.tokens} />
    </>
  );
}
