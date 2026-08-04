import { Deck, DeckThumb, DeckWeb, PRESETS, type Slide } from "@sistema/deck";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { EJEMPLO_LAYOUT, LAYOUTS, type LayoutName, nuevaLamina } from "@/modules/decks/ejemplos";
import { SchemaForm, schemaParaLayout } from "@/modules/decks/SchemaForm";

/**
 * Taller de láminas (corte 2, versión sin base de datos). Arma un deck sin
 * escribir JSON: panel de láminas, formulario por layout generado desde el
 * esquema zod, cambio de layout conservando campos compatibles. Guarda en el
 * navegador (localStorage), no en Supabase: la persistencia real llega con la
 * base. El guardado es explícito, no automático.
 */
export const Route = createFileRoute("/decks/taller")({
  component: Taller,
});

const CLAVE = "sistema.deck.taller";
const CLAVE_TEMA = "sistema.deck.taller.tema";

type DeckLocal = {
  meta: { title: string; lang: "es"; aspect: "16:9"; confidential: boolean };
  slides: Slide[];
};

const DECK_INICIAL: DeckLocal = {
  meta: { title: "Deck sin título", lang: "es", aspect: "16:9", confidential: true },
  slides: [structuredClone(EJEMPLO_LAYOUT.cover), structuredClone(EJEMPLO_LAYOUT.statement)],
};

/** Claves compartidas entre dos layouts, para conservar al cambiar de layout. */
function clavesComunes(a: string, b: string): string[] {
  const sa = schemaParaLayout(a);
  const sb = schemaParaLayout(b);
  if (!sa || !sb) return [];
  // biome-ignore lint/suspicious/noExplicitAny: shape es interno de zod
  const ka = Object.keys((sa as any).shape);
  // biome-ignore lint/suspicious/noExplicitAny: shape es interno de zod
  const kb = new Set(Object.keys((sb as any).shape));
  return ka.filter((k) => k !== "layout" && kb.has(k));
}

function Taller() {
  const [deck, setDeck] = useState<DeckLocal>(DECK_INICIAL);
  const [sel, setSel] = useState(0);
  const [preset, setPreset] = useState(0);
  const [guardado, setGuardado] = useState(true);
  const [verCompleto, setVerCompleto] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Carga desde el navegador tras montar (evita desajuste de hidratación).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) setDeck(JSON.parse(raw));
      const t = localStorage.getItem(CLAVE_TEMA);
      const i = PRESETS.findIndex((p) => p.id === t);
      if (i >= 0) setPreset(i);
    } catch {}
  }, []);

  const tema = PRESETS[preset]?.tokens ?? PRESETS[0].tokens;
  const temaId = PRESETS[preset]?.id ?? PRESETS[0].id;
  const lamina = deck.slides[Math.min(sel, deck.slides.length - 1)];

  function elegirTema(i: number) {
    setPreset(i);
    try {
      localStorage.setItem(CLAVE_TEMA, PRESETS[i]?.id ?? PRESETS[0].id);
    } catch {}
  }

  function verImprimible() {
    // Guarda antes de abrir: la imprimible lee el deck de localStorage.
    localStorage.setItem(CLAVE, JSON.stringify(deck));
    setGuardado(true);
    window.open(`/decks/taller/print?tema=${temaId}`, "_blank", "noopener");
  }

  function slug(s: string): string {
    return (
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "deck"
    );
  }

  /** Descarga el deck como archivo .json, para respaldarlo o moverlo. */
  function descargarDeck() {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(deck.meta.title)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Carga un deck desde un .json, validándolo contra el esquema. */
  function cargarDeck(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = Deck.safeParse(JSON.parse(String(reader.result)));
        if (!parsed.success) {
          alert("El archivo no es un deck válido.");
          return;
        }
        const d = parsed.data;
        mut({
          meta: { title: d.meta.title, lang: "es", aspect: "16:9", confidential: true },
          slides: d.slides,
        });
        setSel(0);
      } catch {
        alert("No se pudo leer el archivo.");
      }
    };
    reader.readAsText(file);
  }

  function mut(next: DeckLocal) {
    setDeck(next);
    setGuardado(false);
  }
  function setSlides(slides: Slide[]) {
    mut({ ...deck, slides });
  }

  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify(deck));
    setGuardado(true);
  }
  function restablecer() {
    const fresco = structuredClone(DECK_INICIAL);
    setDeck(fresco);
    setSel(0);
    setGuardado(false);
  }

  function editarLamina(s: Slide) {
    const slides = [...deck.slides];
    slides[sel] = s;
    setSlides(slides);
  }
  function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= deck.slides.length) return;
    const slides = [...deck.slides];
    [slides[i], slides[j]] = [slides[j] as Slide, slides[i] as Slide];
    setSlides(slides);
    setSel(j);
  }
  function duplicar(i: number) {
    const slides = [...deck.slides];
    slides.splice(i + 1, 0, structuredClone(deck.slides[i] as Slide));
    setSlides(slides);
    setSel(i + 1);
  }
  function eliminar(i: number) {
    if (deck.slides.length <= 1) return;
    setSlides(deck.slides.filter((_, j) => j !== i));
    setSel(Math.max(0, i - 1));
  }
  function agregar(layout: LayoutName) {
    const slides = [...deck.slides];
    slides.splice(sel + 1, 0, nuevaLamina(layout));
    setSlides(slides);
    setSel(sel + 1);
    setAddOpen(false);
  }
  function cambiarLayout(nuevo: LayoutName) {
    const actual = deck.slides[sel] as Slide;
    if (actual.layout === nuevo) return;
    const base = nuevaLamina(nuevo) as unknown as Record<string, unknown>;
    const prev = actual as unknown as Record<string, unknown>;
    for (const k of clavesComunes(actual.layout, nuevo)) {
      if (prev[k] !== undefined) base[k] = prev[k];
    }
    editarLamina(base as unknown as Slide);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <input
            className="min-w-0 flex-1 rounded-md border border-line px-3 py-1.5 font-medium text-lg"
            value={deck.meta.title}
            onChange={(e) => mut({ ...deck, meta: { ...deck.meta, title: e.target.value } })}
          />
          <div className="flex items-center gap-2">
            <span className={`text-xs ${guardado ? "text-neutral-400" : "text-amber-600"}`}>
              {guardado ? "Guardado" : "Sin guardar"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) cargarDeck(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-soft"
              title="Cargar un deck desde un archivo .json"
            >
              Cargar
            </button>
            <button
              type="button"
              onClick={descargarDeck}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-soft"
              title="Descargar este deck como archivo .json"
            >
              Descargar
            </button>
            <button
              type="button"
              onClick={restablecer}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-soft"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={verImprimible}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-soft"
            >
              Ver imprimible / PDF
            </button>
            <button
              type="button"
              onClick={guardar}
              className="rounded-md border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm text-white"
            >
              Guardar
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 text-xs uppercase tracking-wider">Tema</span>
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => elegirTema(i)}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                i === preset
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-line hover:bg-soft"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setVerCompleto((v) => !v)}
            className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs hover:bg-soft"
          >
            {verCompleto ? "Ocultar vista completa" : "Ver vista completa"}
          </button>
        </div>

        <div className="grid grid-cols-[210px_1fr_300px] gap-4">
          {/* Panel de láminas */}
          <div className="grid content-start gap-1.5">
            {deck.slides.map((s, i) => (
              <div
                key={i}
                className={`rounded-md border p-1.5 ${i === sel ? "border-neutral-900" : "border-line"}`}
              >
                <button type="button" onClick={() => setSel(i)} className="block w-full text-left">
                  <div className="overflow-hidden rounded">
                    <DeckThumb
                      deck={{ ...deck, slides: deck.slides } as never}
                      theme={tema}
                      index={i}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-neutral-500 text-xs">
                    <span>
                      {String(i + 1).padStart(2, "0")} · {s.layout}
                    </span>
                  </div>
                </button>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    className="rounded border border-line px-1 text-xs hover:bg-soft"
                    title="Subir"
                    onClick={() => mover(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-line px-1 text-xs hover:bg-soft"
                    title="Bajar"
                    onClick={() => mover(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded border border-line px-1 text-xs hover:bg-soft"
                    title="Duplicar"
                    onClick={() => duplicar(i)}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    className="rounded border border-line px-1 text-xs hover:bg-soft disabled:opacity-40"
                    title="Eliminar"
                    disabled={deck.slides.length <= 1}
                    onClick={() => eliminar(i)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => setAddOpen((v) => !v)}
                className="w-full rounded-md border border-line border-dashed px-2 py-1.5 text-neutral-600 text-sm hover:bg-soft"
              >
                + Agregar lámina
              </button>
              {addOpen && (
                <div className="absolute z-10 mt-1 grid max-h-64 w-full gap-0.5 overflow-auto rounded-md border border-line bg-white p-1 shadow-sm">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => agregar(l)}
                      className="rounded px-2 py-1 text-left text-xs hover:bg-soft"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulario de la lámina seleccionada */}
          <div className="rounded-lg border border-line p-4">
            {lamina && (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">Layout</span>
                  <select
                    className="rounded-md border border-line px-2 py-1 text-sm"
                    value={lamina.layout}
                    onChange={(e) => cambiarLayout(e.target.value as LayoutName)}
                  >
                    {LAYOUTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <SchemaForm slide={lamina} onChange={editarLamina} />
              </>
            )}
          </div>

          {/* Vista previa de la lámina */}
          <div className="grid content-start gap-2">
            <span className="text-neutral-400 text-xs uppercase tracking-wider">Vista</span>
            <div className="overflow-hidden rounded-md border border-line">
              {lamina && (
                <DeckThumb deck={{ ...deck, slides: [lamina] } as never} theme={tema} index={0} />
              )}
            </div>
            <p className="text-neutral-400 text-xs">
              {deck.slides.length} láminas · se guarda en este navegador
            </p>
          </div>
        </div>

        {verCompleto && (
          <div className="mt-6 overflow-hidden rounded-lg border border-line">
            <DeckWeb
              deck={{ ...deck, slides: deck.slides } as never}
              theme={tema}
              scale={0.42}
              chrome={false}
            />
          </div>
        )}

        <p className="mt-6 text-neutral-400 text-xs">
          Editor sin conexión. La persistencia real y el export a PDF de tu deck llegan al conectar
          Supabase.{" "}
          <Link to="/decks/ejemplo" className="underline">
            Ver el ejemplo
          </Link>
        </p>
      </div>
    </Shell>
  );
}
