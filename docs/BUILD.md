# Instrucciones de construcción — esqueleto y módulo Decks

Documento para Claude Code. Define qué ya existe, qué construir, en qué orden y
con qué criterio de terminado.

**Lee primero:** `CLAUDE.md` (invariantes), `docs/MODULOS.md` (funciones y flujos),
`docs/modulos/decks.md` (plan de cortes).

---

## 0 · Cómo usar este documento

Cada tarea trae objetivo, archivos que toca, criterio de aceptación y notas.
Las tareas se hacen **en orden**: cada una deja algo verificable.

Antes de dar por cerrada cualquier tarea:

```bash
pnpm check && pnpm type && pnpm test
```

Si una tarea toca la base, además `pnpm db:push && pnpm db:types`.

**No abras dos tareas a la vez.** Este repo lo mantiene una sola persona y el
historial tiene que poder leerse tarea por tarea.

---

## 1 · Lo que ya existe y no se rehace

| Ruta | Qué es |
|---|---|
| `supabase/migrations/*.sql` | Esquema completo de los nueve módulos. Aplicar, no reescribir |
| `packages/core-llm` | Cliente único de modelos, política por tarea, errores tipados |
| `packages/core-agents` | Contrato de agentes, runtime con guardrails y reintento, pipelines |
| `packages/guardrails` | Siete chequeos, cuatro implementados como código duro, con tests |
| `packages/deck` | Esquema `Deck`, 14 layouts, 4 temas, render web y print, export PDF |
| `packages/db` | Capa de acceso para artefactos y temas |
| `apps/worker` | Worker Python de OCR y ASR |
| `apps/web` | Shell, registro de módulos, rutas base y de Decks |
| `.github/workflows` | CI y su par docs-only |

**Si algo de esto estorba, se corrige donde está.** No se duplica ni se rodea.

---

## 2 · Invariantes

Están en `CLAUDE.md`. Los tres que más se rompen por descuido:

1. Ningún módulo llama a un endpoint de modelo fuera de `core-llm`.
2. Ningún módulo consulta tablas directamente: todo por `packages/db`.
3. Toda tabla nueva lleva RLS con `is_member`. Nunca `using (true)`.

---

# Parte A · Esqueleto

## E1 · Arranque verificado

**Objetivo.** Que el proyecto levante y los tests pasen antes de escribir nada.

```bash
pnpm install
supabase db push
pnpm db:types
pnpm test
pnpm --filter @sistema/web dev
```

**Aceptación.** `/login` carga. Los tests de guardrails pasan en verde, incluidos
los dos de regresión: la negación y la cita atribuida a un tercero.

**Nota.** `pnpm db:types` escribe `packages/db/src/types.gen.ts`. Ese archivo se
genera, no se edita.

---

## E2 · Primer workspace — **hueco conocido, arreglar primero**

**Objetivo.** Hoy `requireAuth` falla con "Sin workspace asignado" y no existe
nada que cree el primero. Sin esto no se puede entrar.

**Archivos.**
- Migración nueva `20260804..._bootstrap_workspace.sql`
- `apps/web/src/routes/_auth/route.tsx`

**Qué hacer.** Una función `security definer` que, si el usuario autenticado no
tiene membresía, cree un workspace y su `memberships` con rol `owner`, y lo
devuelva. Idempotente: si ya tiene, devuelve el que tiene.

```sql
create or replace function bootstrap_workspace(ws_name text default 'Mi espacio')
returns uuid language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  select workspace_id into ws from memberships where user_id = auth.uid() limit 1;
  if ws is not null then return ws; end if;
  insert into workspaces (name) values (ws_name) returning id into ws;
  insert into memberships (workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
  insert into profiles (id, email)
    values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''))
    on conflict (id) do nothing;
  return ws;
end $$;
```

**Aceptación.** Un usuario nuevo entra por magic link y llega a `/` sin errores.
Llamar dos veces a `bootstrap_workspace` devuelve el mismo id.

---

## E3 · Query client y estados

**Objetivo.** Las rutas de Decks ya usan `useQuery` y hoy no hay provider.

**Archivos.** `apps/web/src/routes/__root.tsx`, `apps/web/src/router.tsx`.

**Qué hacer.** `QueryClientProvider` en el root. Un `errorComponent` y un
`pendingComponent` en el router, sobrios: una línea de texto, sin animación de
carga a pantalla completa.

**Aceptación.** Cortar la red y navegar a `/decks` muestra un mensaje legible,
no una pantalla en blanco.

---

## E4 · Almacenamiento de imágenes

**Objetivo.** Las láminas llevan imágenes y no hay dónde ponerlas.

**Qué hacer.** Bucket `deck-media`, privado, con políticas por `workspace_id` en
el prefijo de la ruta (`{workspace_id}/{artifact_id}/{archivo}`). Helper
`uploadDeckImage` en `packages/db`, que devuelve una URL firmada.

**Aceptación.** Una imagen subida desde un workspace no es legible desde otro.

**Nota.** El render de impresión necesita que las imágenes carguen antes de que
Playwright dispare. Usar URLs firmadas de larga duración en `/print`, o
`waitForLoadState("networkidle")`, que ya está en `exportDeckPdf`.

---

# Parte B · Módulo Decks

## D1 · Cerrar el corte 1: exportar PDF

**Objetivo.** El botón que falta. `exportDeckPdf` ya está escrito.

**Archivos.** `apps/web/src/modules/decks/functions.ts`,
`apps/web/src/routes/_auth/decks.$id.tsx`.

**Qué hacer.** Server function `fnExportPdf` que llame a `exportDeckPdf` con la
URL base del entorno, devuelva el archivo como descarga, y no exponga la ruta de
disco. Instalar el navegador: `npx playwright install chromium`.

**Aceptación.** El PDF descargado tiene una página por lámina, mide 1920×1080, y
**el texto se puede seleccionar y buscar**. Si el texto no se selecciona, algo
volvió a la captura raster y está mal.

**Verificación automática.** `pnpm test:e2e` con `DECK_ID` apuntando a un deck
existente.

---

## D2 · Editor de láminas (corte 2)

**Objetivo.** Armar un deck de doce láminas sin escribir JSON.

**Qué hacer.**
- Panel lateral con las láminas: reordenar, duplicar, eliminar.
- Formulario por layout, **generado desde el esquema zod** de cada variante de
  `Slide`. No escribas catorce formularios a mano.
- Cambiar el layout de una lámina conservando los campos compatibles.
- Guardar llama a `saveDeckVersion`: crea versión nueva, no pisa.

**Aceptación.** Crear un deck desde cero con al menos seis layouts distintos,
guardarlo, recargar y ver los cambios. `artifact_versions` tiene una fila por
cada guardado.

**Nota de UX.** El guardado es explícito, no automático. Un deck que se
autoguarda mientras lo editas genera veinte versiones inútiles y esconde la que
importa.

---

## D3 · Selector de temas y alternativas (corte 3)

**Objetivo.** Ver el mismo deck en cuatro registros y elegir.

**Qué hacer.**
- Pantalla de biblioteca con `DeckThumb` por tema.
- `fnGenerarTemas` ya existe: produce fiel, dos variaciones y un contraste.
- El selector muestra la **lámina real del deck**, no una muestra genérica.
- Al elegir, `recordThemeChoice` con `artifact_kind`, para aprender por contexto.

**Aceptación.** Cambiar de tema no toca el `Deck`: solo `themeId`. El mismo deck
con los cuatro presets se ve como cuatro decks distintos.

**Regla.** Con menos de ocho elecciones sobre un eje, el sistema no presenta
ninguna preferencia como establecida. Puede decir "todavía no sé".

---

## D4 · Referencia estética subida

**Objetivo.** Subir un deck que te guste y sacarle el tema.

**Qué hacer.**
- Subida con `purpose = 'estilo'` a la cola de ingesta.
- En el worker, `themes.py`: de un `.pptx`, leer el tema con `python-pptx`
  (colores, fuentes, márgenes) → `fidelity = 'medido'`. De un PDF o imágenes,
  paleta por agrupamiento de píxeles y tipografía por `pdffonts` →
  `fidelity = 'inferido'`.
- Escribir `style_references` y un `deck_themes` con `origin = 'extraido'`.

**Aceptación.** Un pptx subido produce un tema cuya paleta coincide con la del
archivo. La interfaz muestra si los valores son medidos o inferidos.

**Límite que no se cruza.** Se extraen **tokens**: paleta, tipografías, escala,
densidad, proporción, geometría de ornamento. **No se extraen activos**:
fotografías, ilustraciones, logotipos ni ornamentos dibujados. Se descartan sin
guardarse.

**Al subir, se pregunta el destino:** material propio → Cerebro, conocimiento
ajeno → Campus, referencia estética → biblioteca de temas.

---

## D5 · Exportar a .pptx — **funcionalidad nueva**

**Objetivo.** Entregar un deck editable a alguien que no usa este sistema.

**Por qué.** Hoy el módulo **lee** pptx pero no lo escribe. Un auspiciador o una
agencia va a pedir el archivo, no el PDF.

**Qué hacer.** En el worker, `pptx_export.py` con `python-pptx`: una diapositiva
de 1920×1080 por lámina, tema aplicado como colores y fuentes reales, cajas de
texto posicionadas según el layout, imágenes insertadas desde Storage.

**Aceptación.** El `.pptx` abre en PowerPoint y en Keynote, el texto es editable
y los colores coinciden con el tema.

**Alcance honesto.** No todos los layouts sobreviven igual. `table`, `kpi-grid`,
`agenda`, `steps` y `qty-list` mapean bien a formas nativas. `fullbleed` y
`statement` mapean como imagen de fondo más caja de texto. Documenta en el
código qué layout pierde fidelidad y por qué, en vez de fingir paridad.

---

## D6 · Generativo desde texto o archivo (corte 4)

**Objetivo.** Un brief entra, un deck sale.

**Qué hacer.**
- Agente `deck.estructura`: decide qué láminas y con qué layout del catálogo.
- Agente `deck.slide`: llena cada lámina contra su esquema zod.
- Guardrails sobre `deckText(deck)` completo, no lámina por lámina.
- Entradas: texto pegado, archivo por la cola con `purpose = 'artefacto'`, o
  Cerebro. Modos `fuente` y `esqueleto`.
- `contextSource: "manual"` para que funcione con el Cerebro vacío.

**Aceptación.** Un brief de dos páginas produce un deck de diez a catorce
láminas con al menos cuatro layouts distintos, y pasa los guardrails con el
perfil `arranque`.

**Lo que evita la fuga.** Al cerrar, ofrecer subir al Cerebro los datos y frases
del origen que no estén, con `origin = 'deck_source'`. Misma bandeja de siempre.

---

## D7 · Desde el Cerebro (corte 5)

**Depende del módulo Cerebro.** No empezar antes.

**Qué hacer.** Selección de frente y tipo (pitch VC, auspicio, propuesta de
piloto, dossier, media kit). El agente arma el deck con los hechos en verde y la
voz registrada. Una `quote` con `voiceId` se valida contra `voice`.

**Aceptación.** Un deck generado desde el Cerebro no contiene ninguna cita que
no exista en `voice`, y ningún dato duro que venga de un hecho en amarillo.

**Umbral práctico.** Unos quince hechos en verde. Una lámina tiene pocas
palabras y cada una carga más contexto que un párrafo.

---

# Parte C · Verificación

## Los cinco tests que valen más que otros cincuenta

1. Un chequeo bloqueante impide aprobar, incluso ejecutando SQL directo.
2. "no está validado" pasa el chequeo de validación. *(ya escrito)*
3. Una cita atribuida a un tercero no se marca como inventada. *(ya escrito)*
4. Procesar dos veces el mismo archivo no genera trabajo duplicado.
5. Cada layout rinde sin desbordar a 1920×1080.

El quinto se hace con Playwright recorriendo un deck que use los catorce
layouts, comparando `scrollHeight` contra 1080 en cada sección.

## Definición de terminado del módulo

- Un deck se crea, edita, tematiza y exporta a PDF y a pptx sin escribir JSON.
- El PDF tiene texto seleccionable.
- El render web tiene scroll suave y respeta `prefers-reduced-motion`.
- Los cuatro presets están sembrados y se pueden previsualizar sobre el deck real.
- CI en verde.

---

# Parte D · Deuda conocida

Anotada a propósito, no olvidada:

1. **Sesión por bearer token, no por cookie.** `@supabase/ssr` es el enfoque más
   correcto. Portarlo es media hora y toca el middleware que hoy funciona.
2. **Sin backup del Cerebro.** Cuando exista el módulo Cerebro, exportación
   programada fuera de Supabase. Un corpus de dos años es irreemplazable.
3. **Sin conjunto de evaluación de prompts.** `prompt_versions` existe; los casos
   dorados no. Sin ellos, cada cambio de prompt es una apuesta a ciegas.
4. **Sin política de retención.** `agent_runs` replica el contexto en cada fila.
5. **Acumin Pro requiere licencia.** Los presets usan Barlow, que es la fuente a
   la que el sitio original ya cae. Si quieres el Acumin real, agrega el kit.
6. **Compliance apagado.** Decisión tomada: la plataforma es privada. Antes de
   encenderlo hay que verificar la norma chilena vigente sobre datos personales.

---

# Nota final para quien construya esto

El orden de las tareas está pensado para que cada una deje algo usable. Si en
algún momento hay que elegir entre avanzar en el sistema y usar lo que ya está
construido, se elige usarlo.

El activo de este proyecto no es el código: es el Cerebro. El software es
andamio.
