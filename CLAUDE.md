# Sistema — contrato de trabajo

Sistema operativo personal de conocimiento, producción de contenido y marca.
Un solo operador. Nueve módulos sobre un núcleo compartido.

<!-- AUTO-MANAGED: architecture -->
## Arquitectura

```
apps/web              shell único, un módulo por carpeta en src/modules
apps/worker           Python: OCR y ASR. Docker local, consume la cola
packages/db           tipos generados y capa de acceso
packages/core-llm     cliente único de modelos + política por tarea
packages/core-agents   runtime, contrato de agentes, pipelines
packages/guardrails   los siete chequeos
packages/deck         esquema de Deck, temas, export a PDF
supabase/migrations   esquema completo
docs/modulos          especificación por módulo
```

Comandos: `pnpm type`, `pnpm test`, `pnpm test:e2e`, `pnpm check`,
`pnpm db:push`, `pnpm db:types`.

CI en `.github/workflows/`. El par `ci.yml` / `docs-only.yml` existe para que un
PR que solo toca documentación no quede bloqueado esperando checks requeridos
que nunca se disparan.
<!-- END AUTO-MANAGED -->

## Invariantes que no se negocian

1. **Nadie llama a un endpoint de modelo fuera de `core-llm`.** Si necesitas un
   proveedor nuevo, se agrega ahí.
2. **Nadie lee tablas directamente desde un módulo.** Todo pasa por `packages/db`.
3. **Toda salida de agente atraviesa `guardrails`.** No es opcional ni se llama
   a mano: lo hace `runAgent`.
4. **Un chequeo que estorba se corrige en el paquete, con su test.** Nunca se
   agrega una excepción en la llamada.
5. **Los datos que entran por ingesta nacen en amarillo.** La máquina propone,
   la persona valida. Sin excepción.
6. **La revisión no es una medición.** Se llama revisión, se muestra como banda,
   y el número queda interno. No la llames score.
7. **Toda tabla con `workspace_id` lleva RLS con `is_member`.** Sin política
   permisiva, nunca.

## Convenciones

- Migraciones: `AAAAMMDDHHMMSS_tema.sql`, una por tema, nunca se editan una vez aplicadas.
- Agentes: se definen con `defineAgent`, declaran `needs` y validan salida con zod.
- Prompts: viven en el agente y se registran en `prompt_versions` al cambiar.
- Español en el dominio y en los comentarios; inglés en nombres de tabla y columna.
- Sin `console.log` en producción; los errores se registran en `agent_runs`.

## Orden de construcción

1. `db` y `core-llm` — no dependen de datos
2. Cerebro y fase 0 (límites) + indicador de proporción
3. Marca — llena el Cerebro con los hechos estructurales
4. Ingesta — el Cerebro se llena por volumen
5. Guardrails — ya hay voz y hechos contra qué chequear
6. Decks — primero el renderizador, luego el generativo
7. Frentes, Anuncios, Voz — independientes entre sí
8. Editorial — necesita artefactos aprobados

Los módulos de producción pueden correr en modo `manual` desde el día uno, así
que este orden es de conveniencia, no de dependencia dura.

## Lo que este repo no hace

- No publica automáticamente en ninguna plataforma.
- No decide por el operador: propone y espera validación.
- No presenta juicios de modelo como mediciones.

## Estado de construcción

| Módulo | Estado |
|---|---|
| Decks | corte 1 de 5 (renderizador y PDF) |
| Los otros ocho | por construir |

El registro está en `apps/web/src/modules/registry.ts`. Habilitar un módulo es
poner `enabled: true` y agregar sus rutas. Los deshabilitados se muestran en gris
para que el mapa completo esté a la vista sin fingir que existen.

Plan por cortes de cada módulo: `docs/modulos/<modulo>.md`.
Tareas concretas con criterio de aceptación: `docs/BUILD.md`. **Empieza por ahí.**
