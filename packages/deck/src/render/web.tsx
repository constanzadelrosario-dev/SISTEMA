"use client";

import { useEffect, useState } from "react";
import type { Deck, ThemeTokens } from "../types";
import { Ornaments } from "./ornaments";
import { useDeckScroll } from "./scroll";
import { SlideBody } from "./slides";

/** Barra de progreso del scroll. Reemplaza al número de lámina del impreso. */
function Progress({ t }: { t: ThemeTokens }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", zIndex: 50 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: t.palette.accent, transition: "width 120ms linear" }} />
    </div>
  );
}

/** Riel de láminas. Objetivos de 44px para que se pueda usar con el pulgar. */
function Rail({ count, t }: { count: number; t: ThemeTokens }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-index") ?? 0));
        }
      },
      { threshold: 0.5 },
    );
    for (const el of document.querySelectorAll("[data-index]")) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Láminas"
      style={{ position: "fixed", right: "16px", top: "50%", transform: "translateY(-50%)", zIndex: 50, display: "flex", flexDirection: "column", gap: "2px" }}
    >
      {Array.from({ length: count }, (_, i) => (
        <a
          key={`rail-${i}`}
          href={`#slide-${i + 1}`}
          aria-label={`Lámina ${i + 1}`}
          aria-current={i === active ? "true" : undefined}
          style={{ width: "44px", height: "22px", display: "grid", placeItems: "center" }}
        >
          <span style={{
            display: "block", width: i === active ? "18px" : "8px", height: "2px",
            background: t.palette.accent, opacity: i === active ? 1 : 0.35,
            transition: "width 200ms ease, opacity 200ms ease",
          }} />
        </a>
      ))}
    </nav>
  );
}

/**
 * Render web: mismo contenido y mismas láminas que el impreso, con alto de
 * viewport y coreografía de scroll. `scale` baja la escala pensada para 1920 a
 * un tamaño legible en pantalla, sin tocar el objeto Deck.
 */
export function DeckWeb({
  deck, theme, scale = 0.5, motion = true, chrome = true,
}: {
  deck: Deck; theme: ThemeTokens; scale?: number; motion?: boolean; chrome?: boolean;
}) {
  useDeckScroll(motion);

  return (
    <div style={{ background: theme.palette.bg, color: theme.palette.fg }}>
      {chrome && <Progress t={theme} />}
      {chrome && <Rail count={deck.slides.length} t={theme} />}
      {deck.slides.map((slide, i) => (
        <section
          key={`${slide.layout}-${i}`}
          id={`slide-${i + 1}`}
          data-index={i}
          data-reveal={motion ? "" : undefined}
          style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
        >
          <Ornaments t={theme} scale={scale} />
          <SlideBody slide={slide} t={theme} scale={scale} />
        </section>
      ))}
    </div>
  );
}

/** Miniatura para el editor y el selector de temas. */
export function DeckThumb({ deck, theme, index = 0 }: { deck: Deck; theme: ThemeTokens; index?: number }) {
  const slide = deck.slides[index];
  if (!slide) return null;
  return (
    <div style={{ aspectRatio: "16/9", background: theme.palette.bg, overflow: "hidden", position: "relative" }}>
      <Ornaments t={theme} scale={0.13} />
      <SlideBody slide={slide} t={theme} scale={0.13} />
    </div>
  );
}
