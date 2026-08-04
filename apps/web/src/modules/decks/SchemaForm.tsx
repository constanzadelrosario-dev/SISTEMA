import { Slide } from "@sistema/deck";
import type { ReactNode } from "react";
import type { z } from "zod";

/**
 * Formulario generado desde el esquema zod de cada variante de Slide.
 * No hay catorce formularios a mano: se introspecciona el esquema y se dibuja
 * el control que corresponde a cada campo, recursivo para objetos y listas.
 *
 * El acceso a `._def` es la API interna de zod v3; se aísla acá y en ningún
 * otro lado. Si zod cambia su forma interna, se corrige en este archivo.
 */

// biome-ignore lint/suspicious/noExplicitAny: introspección de los internos de zod, aislada en este módulo
type AnyDef = any;

/** Quita Optional/Default/Nullable y reporta si el campo es opcional. */
function unwrap(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  let s = schema;
  let optional = false;
  // Puede haber varias capas (p. ej. Optional(Default(...))).
  for (let i = 0; i < 5; i++) {
    const tn = (s._def as AnyDef).typeName as string;
    if (tn === "ZodOptional" || tn === "ZodNullable" || tn === "ZodDefault") {
      if (tn !== "ZodDefault") optional = true;
      s = (s._def as AnyDef).innerType;
    } else break;
  }
  return { inner: s, optional };
}

/** Variante de Slide para un layout dado (un ZodObject del discriminated union). */
export function schemaParaLayout(layout: string): z.ZodTypeAny | null {
  const options = (Slide._def as AnyDef).options as z.ZodTypeAny[];
  for (const opt of options) {
    const shape = (opt as AnyDef).shape as Record<string, z.ZodTypeAny>;
    const lit = shape.layout;
    if (!lit) continue;
    if ((lit._def as AnyDef).value === layout) return opt;
  }
  return null;
}

const LARGOS = new Set(["text", "body", "subtitle", "desc", "caption", "attribution", "alt"]);

function labelDe(key: string): string {
  const m: Record<string, string> = {
    kicker: "Antetítulo",
    title: "Título",
    subtitle: "Subtítulo",
    text: "Texto",
    body: "Cuerpo",
    attribution: "Atribución",
    author: "Autor",
    role: "Rol",
    label: "Etiqueta",
    part: "Parte",
    time: "Hora",
    desc: "Descripción",
    caption: "Pie",
    value: "Valor",
    qty: "Cantidad",
    num: "Número",
    name: "Nombre",
    items: "Ítems",
    bullets: "Viñetas",
    lines: "Líneas",
    rows: "Filas",
    phases: "Fases",
    cells: "Celdas",
    steps: "Pasos",
    head: "Encabezados",
    total: "Total",
    side: "Lado",
    cols: "Columnas",
    overlay: "Oscurecido (0–1)",
    image: "Imagen",
    logo: "Logo",
    src: "Fuente",
    alt: "Texto alternativo",
    position: "Posición",
  };
  return m[key] ?? key;
}

const inputCls =
  "w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-400";
const btnCls = "rounded-md border border-line px-2 py-1 text-xs hover:bg-soft";

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1 block text-neutral-500 text-xs">{label}</span>
      {children}
    </div>
  );
}

/** Editor recursivo para un valor cualquiera según su esquema zod. */
function Valor({
  schema,
  value,
  onChange,
  label,
}: {
  schema: z.ZodTypeAny;
  value: unknown;
  onChange: (v: unknown) => void;
  label: string;
}) {
  const { inner } = unwrap(schema);
  const def = inner._def as AnyDef;
  const tn = def.typeName as string;

  if (tn === "ZodString") {
    const largo = LARGOS.has(label.toLowerCase()) || /texto|cuerpo|descrip|pie|subt/i.test(label);
    const v = typeof value === "string" ? value : "";
    return largo ? (
      <textarea
        className={`${inputCls} min-h-16`}
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input className={inputCls} value={v} onChange={(e) => onChange(e.target.value)} />
    );
  }

  if (tn === "ZodNumber") {
    const v = typeof value === "number" ? value : "";
    return (
      <input
        type="number"
        step="0.05"
        className={inputCls}
        value={v}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }

  if (tn === "ZodEnum") {
    const opts = def.values as string[];
    return (
      <select
        className={inputCls}
        value={String(value ?? opts[0])}
        onChange={(e) => onChange(e.target.value)}
      >
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (tn === "ZodUnion") {
    // Unión de literales (p. ej. cols: 2 | 3 | 4).
    const opts = (def.options as z.ZodTypeAny[]).map((o) => (o._def as AnyDef).value);
    return (
      <select
        className={inputCls}
        value={String(value ?? opts[0])}
        onChange={(e) =>
          onChange(typeof opts[0] === "number" ? Number(e.target.value) : e.target.value)
        }
      >
        {opts.map((o) => (
          <option key={String(o)} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </select>
    );
  }

  if (tn === "ZodObject") {
    const shape = (inner as AnyDef).shape as Record<string, z.ZodTypeAny>;
    const obj = (value ?? {}) as Record<string, unknown>;
    return (
      <div className="grid gap-2 rounded-md border border-line border-dashed p-2">
        {Object.entries(shape).map(([k, sub]) => (
          <Campo key={k} label={labelDe(k)}>
            <Valor
              schema={sub}
              value={obj[k]}
              label={labelDe(k)}
              onChange={(nv) => onChange({ ...obj, [k]: nv })}
            />
          </Campo>
        ))}
      </div>
    );
  }

  if (tn === "ZodArray") {
    const elem = def.type as z.ZodTypeAny;
    const arr = Array.isArray(value) ? (value as unknown[]) : [];
    const vacio = valorVacio(elem);
    return (
      <div className="grid gap-1.5">
        {arr.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <div className="flex-1">
              <Valor
                schema={elem}
                value={item}
                label={label}
                onChange={(nv) => {
                  const next = [...arr];
                  next[i] = nv;
                  onChange(next);
                }}
              />
            </div>
            <button
              type="button"
              className={btnCls}
              title="Quitar"
              onClick={() => onChange(arr.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={`${btnCls} w-fit`}
          onClick={() => onChange([...arr, vacio])}
        >
          + agregar
        </button>
      </div>
    );
  }

  // Literal u otros: no editable.
  return <div className="text-neutral-400 text-xs">—</div>;
}

/** Valor inicial razonable para un elemento nuevo según su esquema. */
function valorVacio(schema: z.ZodTypeAny): unknown {
  const { inner } = unwrap(schema);
  const def = inner._def as AnyDef;
  const tn = def.typeName as string;
  if (tn === "ZodString") return "";
  if (tn === "ZodNumber") return 0;
  if (tn === "ZodEnum") return (def.values as string[])[0];
  if (tn === "ZodUnion")
    return (def.options as z.ZodTypeAny[]).map((o) => (o._def as AnyDef).value)[0];
  if (tn === "ZodArray") return [];
  if (tn === "ZodObject") {
    const shape = (inner as AnyDef).shape as Record<string, z.ZodTypeAny>;
    const out: Record<string, unknown> = {};
    for (const [k, sub] of Object.entries(shape)) {
      const { optional } = unwrap(sub);
      if (!optional) out[k] = valorVacio(sub);
    }
    return out;
  }
  return "";
}

/** Formulario completo de una lámina: recorre los campos del layout. */
export function SchemaForm({ slide, onChange }: { slide: Slide; onChange: (s: Slide) => void }) {
  const schema = schemaParaLayout(slide.layout);
  if (!schema) return null;
  const shape = (schema as AnyDef).shape as Record<string, z.ZodTypeAny>;
  const obj = slide as unknown as Record<string, unknown>;

  return (
    <div className="grid gap-3">
      {Object.entries(shape)
        .filter(([k]) => k !== "layout")
        .map(([k, sub]) => (
          <Campo key={k} label={labelDe(k)}>
            <Valor
              schema={sub}
              value={obj[k]}
              label={labelDe(k)}
              onChange={(nv) => onChange({ ...obj, [k]: nv } as unknown as Slide)}
            />
          </Campo>
        ))}
    </div>
  );
}
