---
name: deck-authoring
description: Usar al crear, editar o revisar decks y presentaciones del sistema. Cubre el catálogo cerrado de layouts, los tokens de tema, las reglas de composición a 1920x1080 y las anti-referencias. Disparadores: deck, presentación, lámina, slide, pitch, media kit, propuesta visual.
---

# Autoría de decks

## El deck es un objeto de datos, no un archivo

`Deck = { meta, themeId, slides[] }`. El contenido no conoce el tema. Un mismo
deck se pinta como sitio scrolleable o como 1920×1080 imprimible.

## Catálogo cerrado

`cover · split · fullbleed · statement · kpi-grid · agenda · timeline · table ·
grid · quote · divider · credits`

Cerrado a propósito: el motor solo garantiza el render de lo que conoce. Si algo
no cabe en un layout, la respuesta correcta es replantear el contenido, no
inventar un layout.

Mapeo típico: tabla de precios → `table` con `total`. Hitos → `timeline`.
Cifras → `kpi-grid`. Horarios → `agenda`. Apertura tipográfica → `statement`.

## Composición a 1920×1080

- Espaciado por tokens: `--pad-y` 96, `--pad-x` 96, `--pad-x-lg` 120. Nunca hardcodear.
- `split` reparte 48/52 texto/imagen. `--text-width` lo controla.
- Impresión: `page-break-after: always` y `print-color-adjust: exact`.
- El gradiente de superposición sigue el borde de la imagen: panel izquierdo → `to right`.
- Una idea por lámina. Si hay dos, son dos láminas.

## PDF

Por impresión nativa con Playwright, nunca por captura. `html2canvas` rasteriza
y pierde el texto seleccionable; con tipografía fina se nota.

## Citas

Una `quote` con `voiceId` se valida contra `voice`. Una cita en un deck no se
inventa jamás.

## Anti-referencias

Título centrado sobre fondo liso, ritmo de agenda, grillas de tarjetas idénticas
con ícono, la métrica gigante con etiqueta chica, texto con gradiente. Si parece
Google Slides, está mal.
