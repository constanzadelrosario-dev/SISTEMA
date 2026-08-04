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

## Estado

Núcleo implementado y esquema completo. La interfaz de los nueve módulos está
por construir: esa es la tarea de Claude Code, guiada por `docs/MODULOS.md`.

## Arranque

```bash
pnpm install
cp apps/worker/.env.example apps/worker/.env   # completar
supabase db push
pnpm db:types
pnpm test
```

Worker:

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
