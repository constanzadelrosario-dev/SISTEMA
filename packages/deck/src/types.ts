import { z } from "zod";

/** Tokens de tema. Nueve parámetros bastan para dos mundos distintos. */
export const ThemeTokens = z.object({
  palette: z.object({
    bg: z.string(),
    fg: z.string(),
    accent: z.string(),
    muted: z.string(),
    surface: z.string(),
  }),
  fonts: z.object({ title: z.string(), body: z.string(), ui: z.string() }),
  scale: z.object({ h1: z.number(), h2: z.number(), body: z.number(), caption: z.number() }),
  density: z.object({
    padY: z.number(),
    padX: z.number(),
    padXLg: z.number().default(120), // layouts a sangre y centrados
    lineHeight: z.number(),
  }),
  ratio: z.object({ textWidth: z.number() }), // 0..1 en layouts split
  accent: z.object({ frequency: z.enum(["rara", "media", "alta"]) }),
  align: z.enum(["izquierda", "centrado"]),
  imagery: z.enum(["sangre", "recuadro", "sin_imagen"]),
  /** Ornamentos de esquina. Solo geometría y opacidad: los activos son de la
   *  marca de origen y no se copian. */
  ornaments: z
    .object({
      corners: z.enum(["ninguno", "linea", "marco"]).default("ninguno"),
      opacity: z.number().default(0.25),
    })
    .default({ corners: "ninguno", opacity: 0.25 }),
});
export type ThemeTokens = z.infer<typeof ThemeTokens>;

const Img = z.object({ src: z.string(), alt: z.string(), position: z.string().optional() });

/**
 * Catálogo CERRADO de layouts. Cerrado a propósito: el motor solo puede
 * garantizar el render de lo que conoce. Cubre los dos decks de referencia.
 */
export const Slide = z.discriminatedUnion("layout", [
  z.object({
    layout: z.literal("cover"),
    kicker: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    image: Img.optional(),
  }),
  z.object({
    layout: z.literal("split"),
    side: z.enum(["left", "right"]),
    kicker: z.string().optional(),
    title: z.string(),
    body: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    image: Img,
  }),
  z.object({
    layout: z.literal("fullbleed"),
    title: z.string().optional(),
    body: z.string().optional(),
    image: Img,
    overlay: z.number().optional(),
  }),
  z.object({
    layout: z.literal("statement"),
    text: z.string(),
    attribution: z.string().optional(),
  }),
  z.object({
    layout: z.literal("kpi-grid"),
    title: z.string().optional(),
    items: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
  z.object({
    layout: z.literal("agenda"),
    title: z.string(),
    part: z.string().optional(),
    rows: z.array(z.object({ time: z.string(), title: z.string(), desc: z.string().optional() })),
  }),
  z.object({
    layout: z.literal("timeline"),
    title: z.string(),
    phases: z.array(z.object({ label: z.string(), items: z.array(z.string()) })),
  }),
  z.object({
    layout: z.literal("table"),
    title: z.string().optional(),
    head: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    total: z.object({ label: z.string(), value: z.string() }).optional(),
  }),
  z.object({
    layout: z.literal("grid"),
    title: z.string().optional(),
    cols: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    cells: z.array(
      z.object({ image: Img.optional(), title: z.string(), caption: z.string().optional() }),
    ),
  }),
  z.object({
    layout: z.literal("quote"),
    text: z.string(),
    author: z.string(),
    role: z.string().optional(),
    voiceId: z.string().optional(),
  }),
  z.object({ layout: z.literal("divider"), label: z.string().optional(), image: Img.optional() }),
  z.object({
    layout: z.literal("steps"),
    title: z.string().optional(),
    steps: z.array(z.object({ num: z.string(), name: z.string(), desc: z.string().optional() })),
  }),
  z.object({
    layout: z.literal("qty-list"),
    title: z.string().optional(),
    items: z.array(z.object({ qty: z.string(), label: z.string() })),
  }),
  z.object({ layout: z.literal("credits"), logo: Img.optional(), lines: z.array(z.string()) }),
]);
export type Slide = z.infer<typeof Slide>;

export const Deck = z.object({
  meta: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    client: z.string().optional(),
    date: z.string().optional(),
    lang: z.enum(["es", "en"]).default("es"),
    aspect: z.literal("16:9").default("16:9"),
    confidential: z.boolean().default(true),
  }),
  themeId: z.string().optional(),
  slides: z.array(Slide).min(1),
});
export type Deck = z.infer<typeof Deck>;

/** Texto plano de todas las láminas: lo que ven los guardrails. */
export const deckText = (d: Deck): string =>
  d.slides
    .map((s) =>
      Object.entries(s)
        .filter(([k]) => !["layout", "image", "logo"].includes(k))
        .map(([, v]) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join(" "),
    )
    .join("\n\n");
