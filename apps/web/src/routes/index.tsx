import { createFileRoute, Link } from "@tanstack/react-router";
import { enabledModules } from "@/modules/registry";

/**
 * Portada por tarea, no por módulo.
 * Nadie se despierta queriendo "entrar a Frentes": se despierta necesitando
 * mandar algo. A medida que se habilitan módulos, se agregan acciones acá.
 */
const ACCIONES = [
  { label: "Armar un deck", to: "/decks/taller", module: "decks" },
  { label: "Ver mis decks", to: "/decks", module: "decks" },
];

export const Route = createFileRoute("/")({
  component: () => {
    const activos = new Set(enabledModules().map((m) => m.id));
    return (
      <div className="mx-auto max-w-2xl p-10">
        <h1 className="font-medium text-xl">¿Qué necesitas hacer?</h1>
        <div className="mt-6 grid gap-2">
          {ACCIONES.filter((a) => activos.has(a.module)).map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="border-line rounded-lg border px-4 py-3 text-sm hover:bg-soft"
            >
              {a.label}
            </Link>
          ))}
          <Link
            to="/decks/ejemplo"
            className="border-line rounded-lg border border-dashed px-4 py-3 text-neutral-600 text-sm hover:bg-soft"
          >
            Ver el deck de ejemplo <span className="text-neutral-400">· sin conexión</span>
          </Link>
        </div>
        <p className="mt-8 text-neutral-500 text-sm">{activos.size} de 9 módulos construidos.</p>
      </div>
    );
  },
});
