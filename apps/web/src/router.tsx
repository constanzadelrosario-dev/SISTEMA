import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Entrada del router. TanStack Start la resuelve como "router entry".
 * Estados sobrios: una línea de texto, sin animación a pantalla completa.
 * Cortar la red y navegar debe mostrar un mensaje legible, no una pantalla
 * en blanco.
 */
export function getRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultPendingComponent: () => <div className="p-6 text-neutral-400 text-sm">Cargando…</div>,
    defaultErrorComponent: ({ error }) => (
      <div className="p-6 text-sm">
        <p className="font-medium">Algo falló.</p>
        <p className="mt-1 text-neutral-500">{error.message}</p>
      </div>
    ),
    defaultNotFoundComponent: () => <div className="p-6 text-sm">No se encontró esta página.</div>,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
