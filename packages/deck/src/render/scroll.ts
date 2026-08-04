"use client";

import { useEffect } from "react";

/**
 * Scroll suave y coreografía para el render web del deck.
 *
 * Carga Lenis y GSAP de forma diferida: el render de impresión no los necesita
 * y no debe pagarlos. Si la persona pidió menos movimiento, no se inicializa
 * nada y las láminas quedan visibles y estáticas, sin pérdida de contenido.
 */
export function useDeckScroll(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis();
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // Las láminas aparecen al entrar. Solo opacidad y desplazamiento:
      // nada que fuerce reflow durante el scroll.
      const revealables = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      for (const el of revealables) {
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
      }

      // Las fuentes reflowean el texto después del primer cálculo.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      cleanup = () => {
        gsap.ticker.remove(tick);
        for (const st of ScrollTrigger.getAll()) st.kill();
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled]);
}
