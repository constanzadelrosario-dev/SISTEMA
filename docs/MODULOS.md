# Módulos: funciones, flujos y relaciones

Nueve módulos con interfaz propia y cuatro capas que los atraviesan sin tenerla.
Los módulos son lugares donde trabajas; las capas son servicios que se aplican
solos.

Para cada módulo: **para qué existe · qué hace · de dónde recibe · a dónde
entrega · tablas · autonomía**.

---

## Índice

| # | Módulo | Rol |
|---|---|---|
| 1 | Ingesta | entrada |
| 2 | Marca | entrada |
| 3 | Campus | conocimiento ajeno |
| 4 | Cerebro | conocimiento propio |
| 5 | Frentes | producción |
| 6 | Anuncios | producción |
| 7 | Voz | producción |
| 8 | Decks | producción y render |
| 9 | Editorial | salida |
| — | Agentes · Guardrails · Artefactos · Revisión | capas transversales |

---

# 1 · Ingesta

**Para qué existe.** El cuello de botella real del sistema es llenar el
conocimiento a mano. Sin este módulo el Cerebro es un formulario que nunca se
termina.

**Qué hace.**
- Acepta cinco tipos de fuente: archivos pesados (video, audio, imagen, PDF),
  URLs vía lector de artículos, YouTube por transcripción nativa o audio, RSS de
  podcasts, y texto pegado.
- Calcula sha256 y encola. El `unique (workspace_id, file_hash, purpose)` impide
  el trabajo duplicado.
- El worker reclama con `claim_ingest_job` usando `for update skip locked`.
- Video: corta con ffmpeg en fragmentos de 120 s con 2 s de solapamiento, extrae
  audio a 16 kHz mono, transcribe, y deduplica la costura al unir.
- Imagen: OCR local con tesseract; si la confianza media cae bajo 0.72 o el
  texto sale casi vacío, cede al modelo de visión.
- Un agente ligero lee cada segmento y propone candidatos tipados.

**De dónde recibe.** Del sistema de archivos local, de la web, y de los `gaps`
abiertos del Cerebro, que usa para marcar segmentos relevantes.

**A dónde entrega.** A `ingest_candidates`, nunca directo. Según `purpose`:
`cerebro` va a la bandeja de validación, `campus` a una cátedra, `artefacto` a
un deck, `estilo` a la biblioteca de temas.

**Tablas.** `sources`, `ingest_jobs`, `ingest_segments`, `ingest_candidates`.
Funciones `claim_ingest_job` y `requeue_stale_jobs`.

**Autonomía.** Alta. Necesita el esquema del Cerebro, no su contenido.

**Flujo.**
```
archivo o URL → hash → ingest_jobs(pending)
  → worker reclama → segmenta → transcribe u OCR
  → ingest_segments → agente propone → ingest_candidates(amarillo)
  → bandeja → validación humana → facts / voice / citations / gaps
```

**Decisión clave.** Todo nace en amarillo. La máquina propone, la persona valida.

---

# 2 · Marca

**Para qué existe.** Los otros ocho módulos producen para una marca que asumen
existente. Este es el que la construye y el único que llena el Cerebro con los
hechos estructurales.

**Qué hace.** Guía las 29 herramientas del toolkit, organizadas en siete fases
(0 a 6). Cada herramienta es un cuestionario conversacional: el sistema hace las
preguntas del paso a paso, una a una, y advierte de los errores frecuentes antes
de que ocurran.

**Fase 0 · límites** (declaraciones, no requieren datos)
- Disciplina narrativa → `marca.limites_narrativos`
- Filosofía de suficiente → `marca.suficiente_*`
- Cadencia sostenible → `marca.cadencia_max`

**Fases 1 a 5 · construcción**

| Fase | Herramientas | Produce |
|---|---|---|
| 1 Descubrimiento | Brand Discovery, DAFO, 360°, Specific Knowledge | historia, valores, fortalezas, `marca.specific_knowledge` |
| 2 Posicionamiento | Golden Circle, Place+Space, Triángulo, Five Ones, Arquetipos, Purple Cow | `marca.por_que`, `marca.nicho`, `marca.arquetipo` |
| 3 Identidad | Signature Story, Verbal Identity, Visual Identity, Media Kit | `voice`, tono, palabras propias y prohibidas, tokens de tema |
| 4 Producción | Pillar Content, LinkedIn OS, Content OS, Newsletter, Jab×3, Pirámide | reglas del editorial |
| 5 Comunidad | Tribes, KPI 5 Steps, 5 vías, Long-term games, Reputación | targets y `marca.monetizacion` |

**Fase 6 · diagnóstico.** The Dip se dispara cuando las métricas quedan planas N
semanas, y revisa las declaraciones de la fase 0.

**El 360° es un instrumento.** Formulario anónimo por token, 8 a 12 informantes
de contextos distintos, mínimo 6 respuestas antes de interpretar, análisis de
brecha entre auto y hetero percepción.

**Tablas.** `brand_tools`, `brand_tool_runs`, `assessment_360`,
`proportion_weeks`.

**Autonomía.** Total. No depende de nada y alimenta a todos.

**Flujo.**
```
herramienta → preguntas guiadas → respuestas
  → agente convierte a candidatos → bandeja → facts / voice
  → al completar una fase se desbloquea la siguiente
```

**Relación inversa.** Cuando un agente de otro módulo no encuentra un dato, el
`gap` apunta a la herramienta que lo produce. El sistema no dice "completa el
arquetipo": dice que corras la herramienta 2.5, que toma noventa minutos.

---

# 3 · Campus

**Para qué existe.** Separar lo que sabes de lo que aprendiste de otros. Hoy tres
plataformas tienen conocimiento externo congelado en archivos TypeScript.

**Qué hace.**
- Organiza cátedras: un autor, un rol declarado, fuentes procesadas y un perfil
  consolidado (ideas clave con cita acotada, tesis central, frameworks propios
  del autor, patrones narrativos, vocabulario, objeciones que combate).
- **Mapa de conocimiento**: compara todas las cátedras y devuelve consensos,
  controversias con el contexto en que cada posición es válida, especialidades
  únicas y vacíos del campo.
- **Síntesis**: ensambla el material en un cuerpo nuevo, con un control de
  mezcla de 0 (autores puros) a 1 (tu perspectiva como hilo conductor), y
  trazabilidad afirmación por afirmación.

**De dónde recibe.** Fuentes de la ingesta con `purpose = 'campus'`.

**A dónde entrega.** Perfiles de cátedra a los módulos de producción que los
invoquen; la síntesis al Cerebro como conocimiento externo consolidado, nunca
como voz propia; y `citations` al chequeo de verbatim.

**Tablas.** `cathedras`, `cathedra_sources`, `knowledge_maps`, `syntheses`,
`citations`.

**Autonomía.** Alta: acepta texto pegado sin necesitar la ingesta.

**Límite.** El Manifiesto es material interno. Las citas van con atribución y
tope de quince palabras, aplicado como restricción en la base.

---

# 4 · Cerebro

**Para qué existe.** Es la única fuente que los agentes pueden citar. Todo lo
demás es contexto; esto es verdad verificada.

**Qué hace.** Guarda cuatro tipos de registro con scopes:

| Tabla | Contenido | Scopes típicos |
|---|---|---|
| `facts` | afirmaciones con semáforo | global, marca, audiencia, limites, instrumento |
| `voice` | frases textuales, inmutables | por hablante |
| `gaps` | datos que faltan | con prioridad y herramienta que los resuelve |
| `commitments` | promesas con fecha | ligadas a targets |

**Semáforo.** Verde es citable, amarillo pendiente, rojo bloquea. No es
decorativo: con `instrumento.validacion` en rojo cambian doce comportamientos
sin que nadie escriba una condición.

**Cómo lo consumen los agentes.** No leen el Cerebro entero. Cada agente declara
`needs` y el runtime entrega solo esa rebanada. `renderBrain` serializa
separando lo verde de lo no confirmado, y explicita que solo las frases de
`voice` pueden entrecomillarse.

**De dónde recibe.** Candidatos de ingesta, salidas de las herramientas de
marca, síntesis del Campus, vacíos de los agentes, y contexto manual promovido
al terminar una pieza.

**A dónde entrega.** Contexto a todo lo que produce, y estado a los guardrails.

**Autonomía.** Es la raíz. No depende de nadie.

**Vista de apoyo.** `v_facts_demandados` implementa el cuarto bucle: un hecho en
amarillo con vacíos asociados sube en la cola de validación.

---

# 5 · Frentes

**Para qué existe.** Sala de ventas y relaciones. Seis frentes con lógicas de
persuasión distintas: a un fondo le importa el impacto, a un VC el mercado, a un
comité editorial el rigor.

**Qué hace.**
- Gestiona `targets` por etapas (prospecto → conversación → LOI → piloto) con
  fit score.
- Cada frente tiene su catálogo de piezas: deck de auspicio y carta de intención
  en auspiciadores; nota de prensa, pitch y op-ed en medios; teoría del cambio y
  presupuesto en fondos; data room y memo de inversión en VC; dossier de
  evidencia y abstract en académico; convenio y MoU en institucional.
- Genera con el pack `eje`, aplicando el framework declarado (StoryBrand,
  Raskin, Sparkline).

**De dónde recibe.** Cerebro y Campus.

**A dónde entrega.** `artifacts`, y `commitments` cuando una pieza promete algo
con fecha, para que el chequeo de coherencia lo tenga después.

**Tablas.** `targets`, `commitments`, `artifacts`, `artifact_versions`.

**Autonomía.** Funciona en modo manual, pero es el que más lo sufre: sus piezas
cargan mucho dato verificable por palabra, así que terminas pegando lo mismo
muchas veces.

---

# 6 · Anuncios

**Para qué existe.** Producción a escala con evaluación dura. Único módulo con
cadena completa de agentes especializados.

**Qué hace.** Ocho pasos: material, descubrimiento, diagnóstico de síntomas y
reframes, estrategia de ángulo, creativo con variantes y guiones, evaluación,
output (quiz y paywall), y plan de lanzamiento. Diez agentes orquestados por
`runPipeline`; un paso opcional que falla se registra y la cadena continúa.

**Evaluación.** Diez dimensiones con pesos según objetivo: alcance pondera
interrupción de patrón, autorreferencia y que no parezca anuncio; LTV pondera
autoridad, exculpación, coherencia de cadena y preparación del siguiente acto.

**De dónde recibe.** Del Cerebro el perfil de audiencia —el nivel de conciencia
de Schwartz cambia todo el registro— y del Campus las cátedras de persuasión.

**A dónde entrega.** `artifacts` de tipo anuncio con sus `reviews`.

**Autonomía.** Alta. Hoy ya funciona sin Cerebro global.

**Lo que cambia al integrarse.** Este módulo genera copy sobre síntomas en
verticales que incluyen salud, y hoy no pasa por ningún chequeo. Integrado pasa
por los siete.

---

# 7 · Voz

**Para qué existe.** Preparar charlas y presencia oral, donde se construye una
autoridad que el texto no reemplaza.

**Qué hace.**
- Cinco etapas de retórica clásica: inventio, dispositio, elocutio, memoria,
  actio. El `doc` de la charla acumula el trabajo de cada una.
- Copilot con módulos: onboarding, comité, SUCCESs, humor, vulnerabilidad, score.
- **Comité**: doce lentes en tres familias (estructura, narrativa, influencia),
  con alcance de una, una familia o todas. Devuelve qué funciona, qué cambiarían
  y su prioridad, más una síntesis de coincidencias y tensiones.
- Puntúa por subhabilidad, calcula la dimensión más débil y recomienda lecciones
  cuyo `trigger_below` corresponda.

**Lo que cambia al integrarse.** Las doce lentes dejan de ser una constante y
pasan a ser cátedras del Campus con material real procesado: el comité pasa de
un ejercicio de memoria del modelo a una lectura fundamentada.

**Autonomía.** Alta. Es el módulo más autocontenido del sistema.

**Bucle.** Es el único ciclo cerrado que ya existe, y el modelo del que se
generalizan las `recommendations` del resto.

---

# 8 · Decks

**Para qué existe.** Todo lo que producen los otros módulos sale como texto
plano. No hay nada que lo renderice.

**Qué hace.**
- Convierte un artefacto en un objeto `Deck`: metadatos, tema y láminas de un
  catálogo cerrado de doce layouts.
- **Tres entradas**: pegar texto, subir archivo (por la misma cola de ingesta,
  con `purpose = 'artefacto'`), o generar desde el Cerebro.
- **Dos modos de lectura**: `fuente` (el agente decide la estructura) y
  `esqueleto` (el documento la trae y se respeta).
- **Dos renders**: web scrolleable para mandar un link, y 1920×1080 imprimible a
  PDF con texto vectorial vía Playwright.
- **Temas**: entidad propia de nueve parámetros. De una referencia se extraen
  tokens, nunca activos. Genera cuatro alternativas: fiel, dos variaciones de un
  eje, y un contraste deliberado.

**Tablas.** `deck_sources`, `deck_themes`, `style_references`, `theme_choices`.

**Autonomía.** El renderizador es autónomo desde la primera semana; solo el modo
generativo necesita contexto. Vale separar las dos mitades en el código.

**Al subir un archivo se pregunta el destino:** material propio, conocimiento
ajeno, o referencia estética. Sin esa pregunta el Cerebro termina conteniendo
frases que no son tuyas.

---

# 9 · Editorial

**Para qué existe.** Único módulo que se ocupa de lo que pasa después de que la
pieza existe. Producir y publicar son problemas distintos.

**Qué hace.**
- **Generador de slots** desde `marca.cadencia_max` (techo duro), la mezcla por
  pilar y los horarios preferidos.
- **Asignador** que llena slots desde el banco de artefactos aprobados, rotando
  pilares para no repetir.
- **Protocolo post-publicación** con checklist temporizado para los primeros
  noventa minutos.
- **Motor de aprendizaje**: agrega resultados por objetivo, y propone cambios de
  política solo con n suficiente.
- **Indicador de proporción**, que se implementa antes que el resto del módulo.

**Tablas.** `schedule_policies`, `schedule_slots`, `slot_outcomes`,
`policy_proposals`, `metrics`, `proportion_weeks`.

**Autonomía.** Ninguna. Necesita artefactos aprobados y la cadencia declarada.

**Flujo de aprendizaje.**
```
política → slots (80% explota, 20% explora) → publicación
  → resultados por objetivo → agregación semanal
  → propuesta con n y dispersión → aprobación humana → nueva versión
```

---

# Capas transversales

## Agentes

Runtime único en `packages/core-agents`. Cada agente declara `needs`, valida
salida con zod y define qué texto ven los guardrails.

`runAgent` hace siempre: arma la rebanada de contexto, llama validando, corre
guardrails, reintenta **una** vez con las observaciones, registra en
`agent_runs`, y convierte lo que faltó en `gaps`.

`runPipeline` encadena agentes; un paso opcional que falla no aborta la cadena.

## Guardrails

Siete chequeos, cuatro duros y tres asistidos. Severidad configurable por perfil
en cascada: artefacto → proyecto → workspace.

Tres puntos de aplicación: dentro del runtime, en la interfaz con los tramos
subrayados, y en el trigger `enforce_guardrails`, que es la única capa que no se
puede saltar por accidente desde una consola.

## Artefactos

Una tabla con versiones. Un anuncio, una nota de prensa, un guion y un deck son
el mismo objeto con distinto `kind`. Cada versión guarda sus fuentes, sus
chequeos, el perfil de guardrails vigente y el `context_source`.

## Revisión

Motor de rúbricas donde los tres evaluadores heredados son configuraciones
distintas. Todo en la misma estructura, así que un op-ed y un anuncio se pueden
comparar y ver como serie de tiempo.

Se muestra como banda, no como número.

---

# Tabla de dependencias

| Módulo | Dura | De calidad | ¿Arranca solo? |
|---|---|---|---|
| Ingesta | esquema del Cerebro | vacíos abiertos | Sí |
| Marca | ninguna | ninguna | Sí |
| Campus | ninguna | ingesta | Sí |
| Decks · render | ninguna | tokens de identidad | Sí |
| Decks · generación | core-agents | Cerebro, Campus | Sí, en modo manual |
| Frentes | core-agents | Cerebro, Campus, compromisos | Sí, pero costoso |
| Anuncios | core-agents | audiencia, Campus | Sí |
| Voz | core-agents | Campus, lecciones | Sí |
| Editorial | artefactos, cadencia | métricas históricas | No |

| Capa | Depende de |
|---|---|
| `core-llm` | nada |
| `artifacts`, `revisión` | solo esquema |
| `core-agents` | `core-llm` y el esquema del Cerebro |
| `guardrails` | contenido del Cerebro: voz, hechos, compromisos, límites |

**Umbral práctico del Cerebro:** verbatim funciona con una frase; validación con
un hecho; un agente de Frentes deja de sonar genérico con ocho a diez hechos en
verde; un deck generativo necesita unos quince, porque cada lámina tiene menos
palabras y cada una carga más contexto.

La fase 1 del toolkit produce justamente ese primer bloque de ocho a diez. Por
eso el orden de construcción se ordena solo.
