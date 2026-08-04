import tailwind from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // El plugin de React va DESPUÉS de tanstackStart(): en dev, Start necesita el
  // runtime de React Refresh (/@react-refresh) o el cliente no hidrata.
  plugins: [tsConfigPaths(), tailwind(), tanstackStart(), viteReact()],
});
