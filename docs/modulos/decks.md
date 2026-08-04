# Módulo Decks — plan de construcción por cortes

Se construye en cinco cortes. Cada uno deja algo usable antes de que exista el
siguiente, y ninguno bloquea a los otros ocho módulos.

---

## Corte 1 · Renderizador y PDF — **hecho**

Lo que ya está en el repo:

- `packages/deck/src/render/slides.tsx` — los doce layouts, escritos una vez.
- `render/print.tsx` — 1920×1080 con corte de página por lámina.
- `render/web.tsx` — mismo contenido en scroll, más miniatura.
- `seed.ts` — deck de ejemplo, para ver el motor funcionando sin base de datos.
- Rutas `/decks`, `/decks/$id`, `/decks/$id/print`.
- `packages/db/src/artifacts.ts` — versionado real.

**Cómo verificarlo:** crear un deck desde el ejemplo, abrir `/decks/$id/print`,
imprimir a PDF desde el navegador. El texto debe quedar seleccionable.

- `render/scroll.ts` — Lenis y GSAP con carga diferida, aparición al entrar, y
  respeto de `prefers-reduced-motion`. El impreso no los carga.
- `render/web.tsx` — barra de progreso y riel de láminas con objetivos de 44px.
- `render/ornaments.tsx` — esquinas de acento, solo geometría.
- `themes/presets.ts` — cuatro temas extraídos de decks reales.
- `tests/e2e/deck-print.spec.ts` — verifica 1920×1080 y texto seleccionable.

**Qué falta acá:** conectar `exportDeckPdf` a un botón. Requiere
`npx playwright install chromium`.

---

## Corte 2 · Editor de láminas

Editar el `Deck` sin tocar JSON a mano.

- Panel de láminas con reordenar, duplicar, eliminar.
- Formulario por layout, generado desde el esquema zod de cada variante.
- Cambiar el layout de una lámina conservando lo que sea compatible.
- Guardar crea versión nueva con `saveDeckVersion`, no pisa.
- Subida de imágenes a Supabase Storage.

**Criterio de terminado:** armar un deck de doce láminas de principio a fin sin
escribir JSON.

---

## Corte 3 · Temas y alternativas

- Pantalla de biblioteca de temas con miniaturas.
- `fnGenerarTemas` ya existe: produce fiel, dos variaciones y un contraste.
- Selector de cuatro alternativas sobre la lámina real del deck.
- Registrar la elección con `recordThemeChoice`.
- Subir referencia estética: pptx (tokens **medidos** vía `python-pptx` en el
  worker), PDF o capturas (tokens **inferidos**). La fidelidad se muestra en la
  interfaz.

**Regla que no se rompe:** de una referencia se extraen tokens, nunca activos.
Fotografías, logotipos y ornamentos de esa identidad se descartan sin guardarse.

**Al subir un archivo se pregunta el destino:** material propio → Cerebro,
conocimiento ajeno → Campus, referencia estética → biblioteca de temas.

---

## Corte 4 · Generativo desde brief o archivo

- `deck.estructura` decide qué láminas y con qué layout.
- `deck.slide` llena cada una contra su esquema.
- Guardrails sobre `deckText(deck)`, no lámina por lámina.
- Entradas: texto pegado, archivo por la cola de ingesta con
  `purpose = 'artefacto'`, o Cerebro.
- Modos `fuente` (el agente estructura) y `esqueleto` (el documento manda).
- `contextSource: "manual"` para que funcione sin Cerebro lleno.

**El detalle que evita la fuga:** al cerrar, ofrecer subir al Cerebro los datos y
frases del origen que no estén. Misma bandeja, `origin = 'deck_source'`.

---

## Corte 5 · Desde el Cerebro

- Selección de frente y tipo (pitch VC, auspicio, piloto, dossier, media kit).
- El agente arma el deck con los hechos en verde y la voz registrada.
- Una `quote` con `voiceId` se valida contra `voice`. Una cita en un deck no se
  inventa jamás.
- Umbral práctico: unos quince hechos en verde. Una lámina tiene pocas palabras
  y cada una carga más contexto que un párrafo.

---

## Lo que este módulo nunca hace

- Copiar activos de una referencia. Solo tokens.
- Inventar un layout fuera del catálogo. Si algo no cabe, se replantea el
  contenido.
- Generar el PDF por captura. Impresión nativa, siempre.
- Publicar en ninguna parte.
