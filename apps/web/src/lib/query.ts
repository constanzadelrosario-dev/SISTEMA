import { QueryClient } from "@tanstack/react-query";

/**
 * Un único QueryClient para la app. El provider vive en el root
 * (ver routes/__root.tsx). Reintentos sobrios: los errores de red se
 * muestran, no se esconden tras reintentos infinitos.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});
