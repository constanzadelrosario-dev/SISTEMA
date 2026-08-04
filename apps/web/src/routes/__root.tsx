import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { GOOGLE_FONTS_HREF } from "@sistema/deck";
import css from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // El sistema es privado y sus artefactos confidenciales.
      { name: "robots", content: "noindex, nofollow" },
      { title: "Sistema" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: GOOGLE_FONTS_HREF },
      { rel: "stylesheet", href: css },
    ],
  }),
  component: () => (
    <html lang="es">
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  ),
});
