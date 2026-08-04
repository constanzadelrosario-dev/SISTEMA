---
name: agent-authoring
description: Usar al crear o modificar un agente del sistema. Define el contrato, cómo declarar el contexto que necesita, cómo validar la salida y qué nunca debe hacer un prompt. Disparadores: agente, prompt, pack, generar pieza, runtime.
---

# Autoría de agentes

## Contrato

```ts
defineAgent({
  id: "eje.pieza",            // pack.nombre
  pack: "eje",
  task: "generacion",         // decide el modelo vía core-llm/policy
  needs: { factKeys: ["marca.nicho", "instrumento.validacion"], voice: true },
  briefSchema: z.object({ ... }),
  outputSchema: z.object({ ... }),
  system: (input) => `...`,
  textForChecks: (out) => out.body,
});
```

`needs` no es documentación: el runtime entrega **solo** esa rebanada del
Cerebro. Pedir de más gasta tokens; pedir de menos genera vacíos falsos.

## Lo que el runtime hace por ti

Armar el contexto, llamar validando contra el esquema, correr guardrails,
reintentar **una** vez con las observaciones, registrar en `agent_runs` y
convertir lo que faltó en `gaps`. No lo repliques en el agente.

## Reglas del prompt

- Prohibido inventar datos. Si falta algo, se declara faltante, no se rellena.
- Solo se pueden entrecomillar frases presentes en `voice`.
- Los hechos en amarillo no se citan como dato duro.
- Devuelve SOLO JSON conforme al esquema, sin preámbulo ni vallas de código.
- El reintento recibe las observaciones: escribe el system para que sepa
  corregirse, no para que se disculpe.

## Un solo reintento

Si falla dos veces, el problema es el brief o el Cerebro, no la redacción. Se
devuelve el diagnóstico al operador en vez de seguir gastando tokens.

## Al cambiar un prompt

Registra la nueva versión en `prompt_versions` y corre el conjunto de casos
dorados del pack. Un cambio sin evaluación es una apuesta a ciegas.
