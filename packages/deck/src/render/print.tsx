import type { Deck, ThemeTokens } from "../types";
import { Ornaments } from "./ornaments";
import { SlideBody } from "./slides";

/**
 * Render de impresión: 1920×1080 exactos, un corte de página por lámina.
 * De acá sale el PDF, imprimiendo con Playwright. No hay captura raster de por
 * medio, así que el texto queda vectorial y seleccionable.
 */
export function DeckPrint({ deck, theme }: { deck: Deck; theme: ThemeTokens }) {
  return (
    <div style={{ background: theme.palette.bg }}>
      {deck.slides.map((slide, i) => (
        <section
          key={`${slide.layout}-${i}`}
          data-slide={i + 1}
          style={{
            width: "1920px",
            height: "1080px",
            background: theme.palette.bg,
            color: theme.palette.fg,
            position: "relative",
            overflow: "hidden",
            pageBreakAfter: "always",
            breakAfter: "page",
          }}
        >
          <Ornaments t={theme} scale={1} />
          <SlideBody slide={slide} t={theme} scale={1} />
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: theme.fonts.ui,
              fontSize: "13px",
              color: theme.palette.muted,
              letterSpacing: "0.2em",
            }}
          >
            {String(i + 1).padStart(2, "0")} / {String(deck.slides.length).padStart(2, "0")}
          </div>
        </section>
      ))}
    </div>
  );
}
