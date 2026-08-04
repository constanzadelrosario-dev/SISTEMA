# Blueprint del sistema

Versión 2 · agosto 2026 · un solo operador
Consolida cinco plataformas propias, dos repos de referencia y tres documentos
de diseño en un sistema de nueve módulos sobre un núcleo compartido.

> El esquema completo vive en `supabase/migrations/`. Los contratos en
> `packages/`. La especificación por módulo en `docs/modulos/`. Este documento
> es el **porqué**: las decisiones y lo que las justifica.

---

## 1 · Punto de partida

Cinco sistemas construidos por separado, cada uno con su proyecto Supabase, su
cliente de modelo escrito a mano y su forma de guardar estado:

| Origen | Qué aporta al sistema |
|---|---|
| Power PR | Cerebro con semáforo, voz verbatim, vacíos, motor de chequeos EJE, seis frentes |
| AdGenius | Diez agentes orquestados en cadena, evaluador de diez dimensiones |
| Saca Tu Voz | Etapas retóricas, comité de doce lentes, único bucle de aprendizaje cerrado |
| Pipeline de contenido | ETL de Instagram y Drive, cola de trabajos con reintentos |
| Motor OCR/ASR | Worker local capaz de ffmpeg y archivos grandes |

Y tres documentos que aportaron lo que faltaba: el Content Intelligence Studio
(el Campus y el nivel de conciencia), el toolkit de marca personal (29
herramientas en seis fases), y dos repos de agencia (los dos motores de deck y
la disciplina de ingeniería).

**El hallazgo que ordenó todo:** los cinco repiten las mismas seis primitivas
con nombres distintos —entidad raíz, fuente de verdad, panel de agentes,
artefacto versionado, evaluador con umbral, vacíos hacia la siguiente acción—.
No son cinco productos: son fases de un mismo ciclo.

---

## 2 · Decisiones estructurales

| Decisión | Elección | Razón |
|---|---|---|
| Base de datos | Un solo Supabase | Sin FK cruzadas no hay integración posible |
| Entorno | Monorepo propio, Claude Code, sin Lovable | Lovable no soporta paquetes compartidos, que es la base de todo |
| Worker | Docker local, consume una cola | Necesita ffmpeg y archivos de cientos de MB. Un VPS es mensualidad fija para uso por ráfagas |
| PDF | Impresión nativa con Playwright | La captura rasteriza y pierde texto seleccionable |
| Multiusuario | Estructura lista, sin UI | `workspace_id` desde el día uno no cuesta nada y evita una migración dolorosa |
| Alcance | Nueve módulos completos | Decisión del operador contra la recomendación del comité; se mitiga con la regla de proporción |

---

## 3 · Las siete capas

1. **Identidad** — workspaces, membresías, RLS con `is_member`.
2. **Ingesta** — worker, cola, candidatos.
3. **Conocimiento** — Cerebro (propio) y Campus (ajeno). Son dos, no uno.
4. **Agentes** — runtime común, packs por dominio.
5. **Guardrails** — siete chequeos con severidad configurable.
6. **Artefactos** — piezas versionadas, incluidos los decks.
7. **Revisión y aprendizaje** — rúbricas, bandas, recomendaciones.

Dos reglas que ordenan el conjunto: **nada sale sin pasar por la capa 5** (salvo
que el operador lo desactive explícitamente y quede registrado), y **nada entra
a la capa 3 sin validación humana**.

---

## 4 · Cerebro y Campus: por qué son dos

El sistema distingue conocimiento **propio** de conocimiento **ajeno**, y esa
distinción no existía en ninguna de las plataformas de origen.

Hoy tres de ellas tienen conocimiento externo hardcodeado: doce lentes de
oratoria como constante de TypeScript, swipe files destilados a mano, y una
tabla de frameworks sin fuentes detrás. El Campus es la tabla que faltaba.

- **Cerebro**: `facts`, `voice`, `gaps`, `commitments`. Lo único citable.
- **Campus**: `cathedras`, `cathedra_sources`, `citations`, `knowledge_maps`,
  `syntheses`. Con autor y atribución siempre.

Consecuencia práctica: el chequeo de verbatim valida contra `voice` las citas
atribuidas a la persona y contra `citations` las atribuidas a terceros. Sin esa
separación el chequeo se vuelve tan ruidoso que se termina apagando.

El mapa de conocimiento devuelve cuatro cosas: consensos, controversias,
especialidades únicas y **vacíos del campo**. La última es la más valiosa: lo
que ningún autor cubre bien es donde puedes decir algo que no está dicho.

---

## 5 · Fase 0: los límites antes que la capacidad

El toolkit de marca pone la sostenibilidad al final del ciclo. En este sistema
va al principio, partida en dos.

**Fase 0 · declaraciones** (día uno, no requieren datos):

- **Disciplina narrativa** → `marca.limites_narrativos`, con tres niveles por
  tema: nunca, contexto cerrado, público. Es el séptimo chequeo.
- **Filosofía de suficiente** → `marca.suficiente_*`. Sobre el umbral, el panel
  deja de presentar el crecimiento como logro.
- **Cadencia sostenible** → `marca.cadencia_max`. Es el techo del calendario.

**Fase 6 · diagnóstico** (requiere datos): The Dip se dispara cuando las
métricas quedan planas N semanas, y revisa las tres declaraciones anteriores.

El motivo es concreto: en salud mental el contenido con más rendimiento es el
más autobiográfico, y la presión hacia la sobreexposición es estructural. Un
sistema que ayuda a producir sin un límite declarado empuja hacia allá por
diseño.

---

## 6 · Guardrails

Siete chequeos. Cuatro duros y determinísticos, tres asistidos por modelo. Los
duros corren primero y sin costo; si alguno bloquea, los asistidos no se
ejecutan.

| # | Chequeo | Tipo | Qué protege |
|---|---|---|---|
| 1 | Validación | duro | Que no se afirme eficacia clínica sobre un instrumento sin validar |
| 2 | Verbatim | duro | Que el sistema no ponga palabras en tu boca |
| 3 | Coherencia | duro | Que no te contradigas con compromisos previos |
| 4 | Límites narrativos | duro | Que no cruces por inercia un límite que tú declaraste |
| 5 | Persuasión | modelo | Informa la revisión; nunca bloquea |
| 6 | Crisis | modelo | Que una pieza sobre crisis ofrezca una vía de ayuda |
| 7 | Compliance | modelo | Datos de terceros y publicidad. **Apagado por defecto** |

### Dos arreglos respecto del motor original

**Negación.** La comparación por substring hacía que "no está validado" —la
redacción correcta— se bloqueara. Ahora hay detección de negación en ventana.

**Atribución.** Las citas de terceros se verifican contra `citations`, no
contra `voice`.

### Perfiles conmutables

Cada chequeo tiene tres estados: `bloqueante`, `advertencia`, `off`. Se agrupan
en perfiles (`clinico`, `marketing`, `borrador`, `arranque`, `libre`) que se
resuelven en cascada: artefacto → proyecto → workspace.

El operador decidió que **también los duros sean conmutables**. Las tres
mitigaciones que lo hacen sostenible:

1. `artifact_versions.guardrail_profile` y `context_source` quedan registrados.
   Sin eso, un artefacto verificado y uno que nunca se chequeó se ven idénticos.
2. Botón de **verificar después**: corre los siete sobre cualquier artefacto,
   sin importar con qué perfil se generó.
3. **Overrides firmados** como alternativa al interruptor: justificación
   obligatoria de veinte caracteres, vigencia de treinta días, contable.

El perfil `arranque` existe para el día uno: con el Cerebro vacío, verbatim
bloquearía toda cita y el sistema se sentiría paralizado desde el principio.

---

## 7 · Revisión, no score

El evaluador heredado usa lenguaje de medición sin propiedades psicométricas: la
misma pieza puede dar 71 y 64 con umbral 70. Nadie verificó fiabilidad entre
corridas, acuerdo con juicio humano ni validez de constructo de las diez
dimensiones.

Para una psicóloga con formación psicométrica construyendo autoridad, esa
contradicción es visible para su propia audiencia. La corrección cuesta cero:

| Antes | Ahora |
|---|---|
| tabla `evaluations` | `reviews` |
| se muestra "82/100" | banda: sólido · aceptable · flojo |
| `total` | `index_value`, interno, para ordenar y ver tendencias |
| umbral de calidad | umbral de revisión: por debajo, conviene mirarlo |

Lo que más engaña no es la palabra, es el dígito: un 82 comunica precisión de un
punto porcentual.

**Camino de mejora, si algún día se quiere hacer de verdad:** correr tres veces
y guardar la dispersión (`runs`, `spread` ya están en el esquema); puntuar
treinta piezas a mano y calcular acuerdo; fundir dimensiones que correlacionen
por encima de 0.85.

El 360° Reach Assessment es la excepción: eso **sí** es un instrumento y
conserva el lenguaje de medición, con consentimiento, anonimato técnico y n
mínimo de seis.

---

## 8 · Modos de contexto

Los cuatro módulos de producción no dependen del Cerebro para arrancar. Prueba
empírica: Saca Tu Voz y AdGenius ya funcionan hoy sin ningún Cerebro global.

```
contextSource: "brain" | "manual" | "mixed"
```

En `manual`, el formulario muestra los campos que el agente declaró en `needs`
para que se peguen ahí. En `mixed`, precarga lo que haya y deja completar.

**Lo que evita que sea una fuga:** todo lo escrito en contexto manual se ofrece
como candidato al Cerebro al terminar, en la misma bandeja, con
`origin = 'brief_manual'`. El atajo alimenta al sistema en vez de esquivarlo.

Consecuencia sobre el orden de construcción: casi nada es estrictamente
secuencial. `core-llm` antes que todo, el esquema del Cerebro antes que la
ingesta, y el editorial después de que existan artefactos. El resto es
conveniencia.

---

## 9 · Decks

### Tres entradas

Pegar texto, subir archivo, o generar desde el Cerebro. Las tres se combinan.

El archivo entra por **la misma cola de ingesta** con `purpose = 'artefacto'`.
No hay un segundo extractor.

Dos modos de lectura: **fuente** (el agente decide la estructura) y **esqueleto**
(el documento ya la trae y se respeta). Un pptx existente es el mejor insumo
para el segundo: `python-pptx` da texto y orden, que mapean casi uno a uno al
catálogo.

### Temas y alternativas

El tema es una entidad propia de nueve parámetros. De una referencia subida se
extraen tokens, nunca activos: paleta, tipografías, escala, densidad,
proporción, frecuencia del acento, alineación, tratamiento de imagen. Las
fotografías, ilustraciones, logotipos y ornamentos de esa identidad se descartan.

Fidelidad declarada: de un pptx los valores son **medidos**; de capturas son
**inferidos**. La interfaz lo dice antes de que te preguntes por qué no quedó
igual.

Se generan cuatro alternativas: fiel, dos variaciones de un eje cada una, y un
contraste deliberado que va en dirección opuesta a la biblioteca, para que el
sistema no te encierre en lo que ya te gusta.

### Al subir un archivo, tres destinos

Material propio → Cerebro. Conocimiento ajeno → Campus con atribución.
Referencia estética → biblioteca de temas, solo tokens. El módulo lo pregunta en
vez de asumirlo.

---

## 10 · Agenda editorial que aprende

Cuatro piezas: generador de slots, asignador, recolector de resultados y motor
de propuestas.

**Cuatro decisiones de diseño, todas para evitar conclusiones falsas:**

1. **"Funciona" se define por objetivo**, no por métrica única. Una pieza de
   conversión con poco alcance y tres mensajes directos funcionó.
2. **Cuatro factores como máximo**: día y hora, formato, tipo de gancho, pilar.
   Con cinco piezas semanales hay ~250 al año; veinte factores dejan cada celda
   con dos casos y todo lo que veas será ruido con forma de patrón.
3. **Mínimo cinco casos por celda** y diferencia mayor que la variabilidad
   interna antes de proponer nada. El sistema debe poder decir "todavía no sé".
4. **20% de exploración.** Sin eso se encierra en el primer patrón detectado y
   nunca descubre que los domingos funcionaban.

Las propuestas se presentan como **hipótesis**, con su n y su dispersión, y las
aprueba el operador. La política queda versionada, así que un cambio se puede
revertir.

**Techo duro:** la agenda no programa por encima de `marca.cadencia_max`. El
motor optimiza dentro del marco declarado en la fase 0, no contra él.

---

## 11 · Regla de proporción

`marca.regla_proporcion`: activa sí o no, ratio por defecto 1:1.

Mide semanas en ventana móvil de ocho: una semana cuenta como publicación si
tuvo al menos una pieza publicada. No bloquea nada; muestra el número.

**Se implementa en el paso 2, no con el editorial.** El módulo editorial es
necesariamente el último, y es justo durante la construcción cuando el riesgo de
dejar de publicar es más alto. `proportion_weeks` es una tabla con un contador:
media hora de trabajo, y protege contra el riesgo que el comité identificó como
el más probable de todos.

---

## 12 · Los cinco bucles

| Señal | Destino |
|---|---|
| Métrica de una pieza | Cátedra nueva propuesta en el Campus |
| Revisión baja | Lección recomendada |
| Dato que faltó | Ingesta dirigida hacia ese vacío |
| Hecho muy pedido | Sube en la cola de validación |
| Resultado de un slot | Propuesta de política de agenda |

El cuarto no estaba en ningún documento de origen: si tres piezas están
detenidas esperando un hecho en amarillo, ese hecho sube por encima de lo que
diga su prioridad declarada. La demanda real es mejor señal que la prioridad que
alguien escribió hace dos meses.

---

## 13 · Riesgos vigentes

**Resueltos en este repo:** RLS permisivo, `.env` desprotegido, duplicación de
fragmentos de video, extensión de audio incorrecta, reproceso sin idempotencia,
rotación de claves sin control, falso positivo de negación.

**Abiertos, y hay que atenderlos:**

1. **Alcance contra capacidad.** Nueve módulos, un constructor. Mitigación
   elegida: modo manual desde el día uno más regla de proporción.
2. **Construir desplaza a publicar.** El riesgo más probable de todos, y ninguna
   decisión de arquitectura lo impide.
3. **Sin backup.** Un Cerebro de dos años es irreemplazable. Exportación
   programada fuera de Supabase, o el sistema es una apuesta a que un proveedor
   no falle.
4. **Sin retención definida.** `agent_runs` replica todo el contexto en cada
   fila: es el activo de depuración más útil y el más sensible.
5. **Sin conjunto de evaluación de prompts.** Sin él, la deriva de calidad es
   invisible. `prompt_versions` existe; los casos dorados no.
6. **Marco legal por verificar.** El chequeo de compliance queda apagado por
   decisión del operador (plataforma privada). Antes de encenderlo hay que
   verificar la norma chilena vigente sobre datos personales, porque el sistema
   trata datos de salud.

---

## 14 · Lo que este sistema es

Un ciclo de cuatro tiempos: capturar, destilar, producir con control, medir y
volver.

Y una advertencia que conviene releer: **el activo no es el software, es el
Cerebro.** Un corpus de hechos verificados y voz propia, acumulado y validado
durante años, con chequeos que impiden contradecirlo. El software es andamio.
Si hay que elegir entre construir más andamio y llenar el Cerebro, se elige lo
segundo.
