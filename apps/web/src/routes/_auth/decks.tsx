import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fnCreateDeck, fnListDecks } from "@/modules/decks/functions";

export const Route = createFileRoute("/_auth/decks")({
  component: () => {
    const nav = useNavigate();
    const { data, refetch, isLoading } = useQuery({
      queryKey: ["decks"],
      queryFn: () => fnListDecks(),
    });

    async function nuevo() {
      const id = await fnCreateDeck({ data: {} });
      await refetch();
      nav({ to: "/decks/$id", params: { id } });
    }

    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="font-medium text-lg">Decks</h1>
            <p className="text-neutral-500 text-sm">Presentaciones y propuestas</p>
          </div>
          <button
            type="button"
            onClick={nuevo}
            className="border-line rounded-md border px-3 py-1.5 text-sm hover:bg-soft"
          >
            Nuevo deck
          </button>
        </div>

        {isLoading && <p className="text-neutral-400 text-sm">Cargando…</p>}

        {data?.length === 0 && (
          <div className="border-line rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm">Todavía no hay decks.</p>
            <p className="mt-1 text-neutral-500 text-sm">
              El primero se crea desde el ejemplo, para ver el renderizador funcionando.
            </p>
          </div>
        )}

        <div className="grid gap-2">
          {data?.map((d) => (
            <Link
              key={d.id}
              to="/decks/$id"
              params={{ id: d.id }}
              className="border-line flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-soft"
            >
              <div>
                <div className="text-sm">{d.title ?? "Sin título"}</div>
                <div className="text-neutral-500 text-xs">
                  v{d.current_version} · {d.status}
                </div>
              </div>
              <span className="text-neutral-400 text-xs">
                {new Date(d.updated_at).toLocaleDateString("es-CL")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  },
});
