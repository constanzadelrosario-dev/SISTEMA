import { createFileRoute } from "@tanstack/react-router";
import { DeckThumb, DeckWeb } from "@sistema/deck";
import { fnGetDeck } from "@/modules/decks/functions";

export const Route = createFileRoute("/_auth/decks/$id")({
  loader: ({ params }) => fnGetDeck({ data: { id: params.id } }),
  component: () => {
    const { row, deck, theme } = Route.useLoaderData();
    const { id } = Route.useParams();

    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h1 className="font-medium text-lg">{deck.meta.title}</h1>
            <p className="text-neutral-500 text-sm">
              {deck.slides.length} láminas · v{row.current_version} · {row.status}
            </p>
          </div>
          <a
            href={`/decks/${id}/print`}
            target="_blank"
            rel="noreferrer"
            className="border-line rounded-md border px-3 py-1.5 text-sm hover:bg-soft"
          >
            Ver imprimible
          </a>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          {deck.slides.map((s, i) => (
            <div key={`${s.layout}-${i}`} className="border-line overflow-hidden rounded-md border">
              <DeckThumb deck={deck} theme={theme} index={i} />
              <div className="px-2 py-1 text-neutral-500 text-xs">
                {String(i + 1).padStart(2, "0")} · {s.layout}
              </div>
            </div>
          ))}
        </div>

        <div className="border-line overflow-hidden rounded-lg border">
          <DeckWeb deck={deck} theme={theme} scale={0.42} />
        </div>
      </div>
    );
  },
});
