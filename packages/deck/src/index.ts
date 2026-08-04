export { DeckPrint } from "./render/print";
// `./pdf` NO se reexporta acá: usa Playwright (solo servidor) y colarlo al
// barrel arrastra ese binario al bundle del navegador. Se importa por subpath
// `@sistema/deck/pdf` desde las server functions. Ver D1 en docs/BUILD.md.
export { SlideBody } from "./render/slides";
export { DeckThumb, DeckWeb } from "./render/web";
export * from "./seed";
export * from "./theme";
export * from "./themes/presets";
export * from "./types";
