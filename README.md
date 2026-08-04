# Sistema

Sistema operativo personal de conocimiento, producción de contenido y marca.

## Qué hay acá

| Ruta | Qué es |
|---|---|
| `docs/BLUEPRINT.md` | Decisiones de arquitectura y su porqué |
| `docs/MODULOS.md` | Funciones, flujos y relaciones de los nueve módulos |
| `supabase/migrations/` | Esquema completo, listo para aplicar |
| `packages/core-llm` | Cliente único de modelos y política por tarea |
| `packages/core-agents` | Contrato de agentes, runtime y pipelines |
| `packages/guardrails` | Los siete chequeos, con tests |
| `packages/deck` | Esquema de Deck, temas y export a PDF |
| `apps/worker` | Worker Python de OCR y ASR |
| `apps/web` | Shell y módulos. **Por construir** |
| `CLAUDE.md` | Contrato de trabajo para Claude Code |
| `docs/BUILD.md` | **Instrucciones de construcción: qué hacer y en qué orden** |

## Estado de construcción

Núcleo implementado, esquema completo, y el **esqueleto de la app arranca**
(`pnpm type`, `pnpm test` y `pnpm check` en verde). El módulo de **Decks** ya se
puede ver y usar sin base de datos.

| Pieza | Estado |
|---|---|
| Esqueleto (rutas, shell, mapa de módulos, React Query) | ✅ hecho |
| Decks · renderizador + export a PDF nativo | ✅ hecho y verificado (texto seleccionable) |
| Decks · mirador del ejemplo (`/decks/ejemplo`) | ✅ sin base de datos |
| Decks · editor de láminas (`/decks/taller`) | ✅ offline, guarda en el navegador |
| E2 · `bootstrap_workspace` | ✅ código; falta aplicar en Supabase |
| Persistencia real, imágenes, generativo, worker | ⏳ requieren Supabase / Docker |

**Sin Docker en la máquina actual:** Supabase local (`supabase start`,
`db:push`, `db:types`) y el worker Python no corren aquí. Todo lo que dependa de
la base queda escrito y marcado como *pendiente de verificar con Supabase*.

## Cómo correr la app localmente (sin base de datos)

```bash
pnpm install
pnpm --filter @sistema/web dev
```

Abre `http://localhost:3000`. Funcionan sin sesión ni base:

- `/decks/ejemplo` — deck de ejemplo con selector de 4 temas
- `/decks/taller` — editor de láminas (guarda en el navegador)

Gates antes de cerrar cualquier tarea: `pnpm check && pnpm type && pnpm test`.

## Cuando haya Supabase (local con Docker, o proyecto en la nube)

```bash
cp apps/worker/.env.example apps/worker/.env   # completar
# apps/web/.env : VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
supabase db push
pnpm db:types
```

Worker (necesita Docker):

```bash
cd apps/worker && docker compose up -d
```

## Orden sugerido

Ver `CLAUDE.md`. En corto: `db` y `core-llm`, luego Cerebro y fase 0 con el
indicador de proporción, luego Marca, Ingesta, Guardrails, Decks, los tres
módulos de producción, y el Editorial al final.

## Una nota

El activo que construye este repo no es el código. Es el Cerebro. Si hay que
elegir entre construir más sistema y llenar el Cerebro, se elige lo segundo.
