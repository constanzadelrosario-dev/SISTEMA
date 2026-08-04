import { DeckThumb, DeckWeb, PRESETS } from "@sistema/deck";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { DECK_CATALOGO } from "@/modules/decks/ejemplos";

/**
 * Catálogo de los 14 layouts, con contenido de ejemplo. Sirve para ver la
 * paleta completa de diseños en cualquiera de los cuatro temas, y para
 * comprobar de un vistazo que cada layout rinde a 1920×1080 sin desbordar.
 */
export const Route = createFileRoute("/decks/catalogo")({
  component: Catalogo,
});

function Catalogo() {
  const [preset, setPreset] = useState(0);
  const tema = PRESETS[preset]?.tokens ?? PRESETS[0].tokens;
  const temaId = PRESETS[preset]?.id ?? PRESETS[0].id;
  const deck = DECK_CATALOGO;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-1 flex items-baseline justify-between">
          <h1 className="font-medium text-lg">Catálogo de layouts</h1>
          <a
            href={`/decks/catalogo/print?tema=${temaId}`}
            target="_blank"
            rel="noreferrer"
            className="border-line rounded-md border px-3 py-1.5 text-sm hover:bg-soft"
          >
            Ver imprimible
          </a>
        </div>
        <p className="text-neutral-500 text-sm">
          Los {deck.slides.length} diseños disponibles, con contenido de ejemplo.
        </p>

        <div className="mt-5 mb-2 text-neutral-400 text-xs uppercase tracking-wider">Tema</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(i)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                i === preset
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-line hover:bg-soft"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {deck.slides.map((s, i) => (
            <div key={`${s.layout}-${i}`} className="border-line overflow-hidden rounded-md border">
              <DeckThumb deck={deck} theme={tema} index={i} />
              <div className="px-2 py-1 text-neutral-500 text-xs">{s.layout}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 mb-2 text-neutral-400 text-xs uppercase tracking-wider">
          Recorrido completo
        </div>
        <div className="border-line overflow-hidden rounded-lg border">
          <DeckWeb deck={deck} theme={tema} scale={0.42} chrome={false} />
        </div>

        <p className="mt-6 text-neutral-400 text-xs">
          <Link to="/decks/taller" className="underline">
            Ir al taller
          </Link>{" "}
          para armar tu propio deck con estos diseños.
        </p>
      </div>
    </Shell>
  );
}
