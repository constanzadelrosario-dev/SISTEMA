import { DECK_EJEMPLO, DeckThumb, DeckWeb, PRESETS } from "@sistema/deck";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";

/**
 * Mirador del deck de ejemplo. Ruta pública a propósito: renderiza el motor de
 * presentaciones sin base de datos ni sesión, para ver el módulo funcionando el
 * primer día. El selector de temas es un adelanto del corte 3: el mismo deck en
 * cuatro registros, sin tocar el objeto Deck, solo el tema.
 */
export const Route = createFileRoute("/decks/ejemplo")({
  component: Mirador,
});

function Mirador() {
  const [preset, setPreset] = useState(0);
  const tema = PRESETS[preset]?.tokens ?? PRESETS[0].tokens;
  const temaId = PRESETS[preset]?.id ?? PRESETS[0].id;
  const deck = DECK_EJEMPLO;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-1 flex items-baseline justify-between">
          <h1 className="font-medium text-lg">{deck.meta.title}</h1>
          <a
            href={`/decks/ejemplo/print?tema=${temaId}`}
            target="_blank"
            rel="noreferrer"
            className="border-line rounded-md border px-3 py-1.5 text-sm hover:bg-soft"
          >
            Ver imprimible (PDF nativo)
          </a>
        </div>
        <p className="text-neutral-500 text-sm">
          {deck.slides.length} láminas · renderizador funcionando sin base de datos
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
              <div className="px-2 py-1 text-neutral-500 text-xs">
                {String(i + 1).padStart(2, "0")} · {s.layout}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 mb-2 text-neutral-400 text-xs uppercase tracking-wider">
          Vista completa
        </div>
        <div className="border-line overflow-hidden rounded-lg border">
          <DeckWeb deck={deck} theme={tema} scale={0.42} chrome={false} />
        </div>

        <p className="mt-6 text-neutral-400 text-xs">
          Esto es el ejemplo sembrado en el código. Para crear y guardar decks propios hace falta
          conectar Supabase.{" "}
          <Link to="/" className="underline">
            Volver
          </Link>
        </p>
      </div>
    </Shell>
  );
}
