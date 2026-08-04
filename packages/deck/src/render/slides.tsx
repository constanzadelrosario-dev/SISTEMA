import type { Slide, ThemeTokens } from "../types";

/**
 * Los doce layouts, escritos una sola vez.
 * El print los envuelve en una sección fija de 1920×1080; el web los envuelve
 * en una sección fluida. El cuerpo es el mismo, así que no hay dos verdades.
 *
 * Estilos en línea a propósito: el tema manda y la fidelidad de impresión no
 * tolera una hoja externa que el motor de impresión pueda ignorar.
 */

type Ctx = { t: ThemeTokens; scale: number };

const px = (n: number, s: number) => `${Math.round(n * s)}px`;

const Kicker = ({ children, c }: { children: string; c: Ctx }) => (
  <div
    style={{
      fontFamily: c.t.fonts.ui,
      fontSize: px(c.t.scale.caption, c.scale),
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      color: c.t.palette.accent,
      marginBottom: px(14, c.scale),
    }}
  >
    {children}
  </div>
);

const Rule = ({ c }: { c: Ctx }) => (
  <div
    style={{
      width: px(48, c.scale),
      height: "1px",
      background: c.t.palette.accent,
      margin: `${px(20, c.scale)} 0`,
      alignSelf: c.t.align === "centrado" ? "center" : "flex-start",
    }}
  />
);

const H1 = ({ children, c }: { children: string; c: Ctx }) => (
  <h1
    style={{
      fontFamily: c.t.fonts.title,
      fontSize: px(c.t.scale.h1, c.scale),
      lineHeight: 1.0,
      color: c.t.palette.fg,
      fontWeight: 400,
      margin: 0,
    }}
  >
    {children}
  </h1>
);

const H2 = ({ children, c }: { children: string; c: Ctx }) => (
  <h2
    style={{
      fontFamily: c.t.fonts.title,
      fontSize: px(c.t.scale.h2, c.scale),
      lineHeight: 1.1,
      color: c.t.palette.fg,
      fontWeight: 400,
      margin: 0,
    }}
  >
    {children}
  </h2>
);

const Body = ({ children, c }: { children: string; c: Ctx }) => (
  <p
    style={{
      fontFamily: c.t.fonts.body,
      fontSize: px(c.t.scale.body, c.scale),
      lineHeight: c.t.density.lineHeight,
      color: c.t.palette.fg,
      opacity: 0.85,
      margin: 0,
      maxWidth: "62ch",
    }}
  >
    {children}
  </p>
);

const pad = (c: Ctx) => `${px(c.t.density.padY, c.scale)} ${px(c.t.density.padX, c.scale)}`;

const Img = ({ src, alt, position }: { src: string; alt: string; position?: string }) => (
  // El render de impresión necesita <img> nativo: Playwright imprime el HTML tal cual.
  <img
    src={src}
    alt={alt}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: position ?? "center",
    }}
  />
);

export function SlideBody({
  slide,
  t,
  scale = 1,
}: {
  slide: Slide;
  t: ThemeTokens;
  scale?: number;
}) {
  const c: Ctx = { t, scale };
  const col = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: t.align === "centrado" ? "center" : "flex-start",
    textAlign: t.align === "centrado" ? "center" : "left",
    padding: pad(c),
    height: "100%",
    ...extra,
  });

  switch (slide.layout) {
    case "cover":
      return (
        <div style={{ ...col(), position: "relative" }}>
          {slide.image && (
            <div style={{ position: "absolute", inset: 0, opacity: 0.45 }}>
              <Img {...slide.image} />
            </div>
          )}
          <div style={{ position: "relative" }}>
            {slide.kicker && <Kicker c={c}>{slide.kicker}</Kicker>}
            <H1 c={c}>{slide.title}</H1>
            {slide.subtitle && (
              <>
                <Rule c={c} />
                <Body c={c}>{slide.subtitle}</Body>
              </>
            )}
          </div>
        </div>
      );

    case "split": {
      const text = (
        <div style={col({ width: `${Math.round(t.ratio.textWidth * 100)}%`, height: "100%" })}>
          {slide.kicker && <Kicker c={c}>{slide.kicker}</Kicker>}
          <H2 c={c}>{slide.title}</H2>
          <Rule c={c} />
          {slide.body && <Body c={c}>{slide.body}</Body>}
          {slide.bullets?.length ? (
            <ul style={{ listStyle: "none", padding: 0, margin: `${px(18, c.scale)} 0 0` }}>
              {slide.bullets.map((b) => (
                <li
                  key={b}
                  style={{ display: "flex", gap: px(12, c.scale), marginBottom: px(10, c.scale) }}
                >
                  <span
                    style={{
                      width: px(8, c.scale),
                      height: px(8, c.scale),
                      marginTop: px(10, c.scale),
                      background: t.palette.accent,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: t.fonts.body,
                      fontSize: px(t.scale.body, c.scale),
                      color: t.palette.fg,
                      opacity: 0.85,
                    }}
                  >
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
      const img = (
        <div
          style={{
            width: `${100 - Math.round(t.ratio.textWidth * 100)}%`,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Img {...slide.image} />
        </div>
      );
      return (
        <div style={{ display: "flex", height: "100%" }}>
          {slide.side === "left" ? (
            <>
              {text}
              {img}
            </>
          ) : (
            <>
              {img}
              {text}
            </>
          )}
        </div>
      );
    }

    case "fullbleed":
      return (
        <div style={{ position: "relative", height: "100%" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <Img {...slide.image} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: t.palette.bg,
              opacity: slide.overlay ?? 0.55,
            }}
          />
          <div style={{ ...col(), position: "relative" }}>
            {slide.title && <H2 c={c}>{slide.title}</H2>}
            {slide.body && (
              <>
                <Rule c={c} />
                <Body c={c}>{slide.body}</Body>
              </>
            )}
          </div>
        </div>
      );

    case "statement":
      return (
        <div style={col({ alignItems: "center", textAlign: "center" })}>
          <div
            style={{
              fontFamily: t.fonts.title,
              fontSize: px(t.scale.h1 * 0.8, c.scale),
              lineHeight: 1.1,
              color: t.palette.fg,
              maxWidth: "22ch",
            }}
          >
            {slide.text}
          </div>
          {slide.attribution && (
            <div
              style={{
                fontFamily: t.fonts.ui,
                fontSize: px(t.scale.caption, c.scale),
                color: t.palette.muted,
                marginTop: px(24, c.scale),
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {slide.attribution}
            </div>
          )}
        </div>
      );

    case "kpi-grid":
      return (
        <div style={col()}>
          {slide.title && (
            <>
              <H2 c={c}>{slide.title}</H2>
              <Rule c={c} />
            </>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(slide.items.length, 4)}, 1fr)`,
              gap: px(40, c.scale),
              width: "100%",
              marginTop: px(20, c.scale),
            }}
          >
            {slide.items.map((i) => (
              <div key={i.label}>
                <div
                  style={{
                    fontFamily: t.fonts.title,
                    fontSize: px(t.scale.h2, c.scale),
                    color: t.palette.accent,
                  }}
                >
                  {i.value}
                </div>
                <div
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: px(t.scale.caption, c.scale),
                    color: t.palette.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginTop: px(8, c.scale),
                  }}
                >
                  {i.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "agenda":
      return (
        <div style={col()}>
          {slide.part && <Kicker c={c}>{slide.part}</Kicker>}
          <H2 c={c}>{slide.title}</H2>
          <Rule c={c} />
          <div style={{ width: "100%" }}>
            {slide.rows.map((r) => (
              <div
                key={r.time + r.title}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${px(200, c.scale)} 1fr`,
                  gap: px(40, c.scale),
                  padding: `${px(14, c.scale)} 0`,
                  borderTop: `1px solid ${t.palette.accent}33`,
                }}
              >
                <div
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: px(t.scale.caption + 3, c.scale),
                    color: t.palette.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                  }}
                >
                  {r.time}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: t.fonts.title,
                      fontSize: px(t.scale.body + 6, c.scale),
                      color: t.palette.fg,
                    }}
                  >
                    {r.title}
                  </div>
                  {r.desc && (
                    <div
                      style={{
                        fontFamily: t.fonts.body,
                        fontSize: px(t.scale.body, c.scale),
                        color: t.palette.fg,
                        opacity: 0.75,
                      }}
                    >
                      {r.desc}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "timeline":
      return (
        <div style={col()}>
          <H2 c={c}>{slide.title}</H2>
          <Rule c={c} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${slide.phases.length}, 1fr)`,
              gap: px(40, c.scale),
              width: "100%",
            }}
          >
            {slide.phases.map((p) => (
              <div
                key={p.label}
                style={{ borderTop: `2px solid ${t.palette.accent}`, paddingTop: px(16, c.scale) }}
              >
                <div
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: px(t.scale.caption, c.scale),
                    color: t.palette.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    marginBottom: px(12, c.scale),
                  }}
                >
                  {p.label}
                </div>
                {p.items.map((i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: t.fonts.body,
                      fontSize: px(t.scale.body - 2, c.scale),
                      color: t.palette.fg,
                      opacity: 0.85,
                      marginBottom: px(8, c.scale),
                    }}
                  >
                    {i}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "table":
      return (
        <div style={col()}>
          {slide.title && (
            <>
              <H2 c={c}>{slide.title}</H2>
              <Rule c={c} />
            </>
          )}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: t.fonts.ui,
              fontSize: px(t.scale.body - 2, c.scale),
            }}
          >
            <thead>
              <tr style={{ background: t.palette.surface }}>
                {slide.head.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: px(14, c.scale),
                      color: t.palette.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      fontSize: px(t.scale.caption, c.scale),
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell) => (
                    <td
                      key={cell}
                      style={{
                        padding: px(12, c.scale),
                        color: t.palette.fg,
                        borderBottom: `1px solid ${t.palette.muted}33`,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {slide.total && (
                <tr style={{ background: t.palette.accent }}>
                  <td
                    colSpan={slide.head.length - 1}
                    style={{ padding: px(14, c.scale), color: t.palette.bg, fontWeight: 500 }}
                  >
                    {slide.total.label}
                  </td>
                  <td style={{ padding: px(14, c.scale), color: t.palette.bg, fontWeight: 500 }}>
                    {slide.total.value}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );

    case "grid":
      return (
        <div style={col()}>
          {slide.title && (
            <>
              <H2 c={c}>{slide.title}</H2>
              <Rule c={c} />
            </>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${slide.cols}, 1fr)`,
              gap: px(28, c.scale),
              width: "100%",
            }}
          >
            {slide.cells.map((cell) => (
              <div key={cell.title}>
                {cell.image && (
                  <div
                    style={{
                      aspectRatio: "4/3",
                      overflow: "hidden",
                      marginBottom: px(12, c.scale),
                    }}
                  >
                    <Img {...cell.image} />
                  </div>
                )}
                <div
                  style={{
                    fontFamily: t.fonts.title,
                    fontSize: px(t.scale.body + 4, c.scale),
                    color: t.palette.fg,
                  }}
                >
                  {cell.title}
                </div>
                {cell.caption && (
                  <div
                    style={{
                      fontFamily: t.fonts.body,
                      fontSize: px(t.scale.body - 4, c.scale),
                      color: t.palette.muted,
                    }}
                  >
                    {cell.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "quote":
      return (
        <div style={col({ alignItems: "center", textAlign: "center" })}>
          <div
            style={{
              fontFamily: t.fonts.title,
              fontSize: px(t.scale.h2 * 0.8, c.scale),
              fontStyle: "italic",
              lineHeight: 1.25,
              color: t.palette.fg,
              maxWidth: "26ch",
            }}
          >
            “{slide.text}”
          </div>
          <div
            style={{
              fontFamily: t.fonts.ui,
              fontSize: px(t.scale.caption, c.scale),
              color: t.palette.accent,
              marginTop: px(24, c.scale),
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            {slide.author}
            {slide.role ? ` · ${slide.role}` : ""}
          </div>
        </div>
      );

    case "divider":
      return (
        <div style={{ position: "relative", height: "100%" }}>
          {slide.image && (
            <>
              <div style={{ position: "absolute", inset: 0 }}>
                <Img {...slide.image} />
              </div>
              <div
                style={{ position: "absolute", inset: 0, background: t.palette.bg, opacity: 0.7 }}
              />
            </>
          )}
          <div
            style={{ ...col({ alignItems: "center", textAlign: "center" }), position: "relative" }}
          >
            {slide.label && <Kicker c={c}>{slide.label}</Kicker>}
            <Rule c={c} />
          </div>
        </div>
      );

    case "steps":
      return (
        <div style={col()}>
          {slide.title && (
            <>
              <H2 c={c}>{slide.title}</H2>
              <Rule c={c} />
            </>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(slide.steps.length, 4)}, 1fr)`,
              gap: px(48, c.scale),
              width: "100%",
            }}
          >
            {slide.steps.map((st) => (
              <div key={st.num}>
                <div
                  style={{
                    fontFamily: t.fonts.title,
                    fontSize: px(t.scale.h2 * 0.7, c.scale),
                    color: t.palette.accent,
                    lineHeight: 1,
                  }}
                >
                  {st.num}
                </div>
                <div
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: px(t.scale.caption + 2, c.scale),
                    color: t.palette.fg,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    margin: `${px(12, c.scale)} 0 ${px(8, c.scale)}`,
                  }}
                >
                  {st.name}
                </div>
                {st.desc && (
                  <div
                    style={{
                      fontFamily: t.fonts.body,
                      fontSize: px(t.scale.body - 3, c.scale),
                      color: t.palette.fg,
                      opacity: 0.75,
                      lineHeight: t.density.lineHeight,
                    }}
                  >
                    {st.desc}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "qty-list":
      return (
        <div style={col()}>
          {slide.title && (
            <>
              <H2 c={c}>{slide.title}</H2>
              <Rule c={c} />
            </>
          )}
          <div style={{ width: "100%" }}>
            {slide.items.map((i) => (
              <div
                key={i.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${px(100, c.scale)} 1fr`,
                  gap: px(24, c.scale),
                  padding: `${px(12, c.scale)} 0`,
                  borderBottom: `1px solid ${t.palette.muted}33`,
                }}
              >
                <div
                  style={{
                    fontFamily: t.fonts.title,
                    fontSize: px(t.scale.body + 8, c.scale),
                    color: t.palette.accent,
                  }}
                >
                  {i.qty}
                </div>
                <div
                  style={{
                    fontFamily: t.fonts.ui,
                    fontSize: px(t.scale.body - 2, c.scale),
                    color: t.palette.fg,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    alignSelf: "center",
                  }}
                >
                  {i.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "credits":
      return (
        <div style={col({ alignItems: "center", textAlign: "center" })}>
          {slide.logo && (
            <div style={{ width: px(200, c.scale), marginBottom: px(28, c.scale) }}>
              <Img {...slide.logo} />
            </div>
          )}
          <Rule c={c} />
          {slide.lines.map((l) => (
            <div
              key={l}
              style={{
                fontFamily: t.fonts.body,
                fontSize: px(t.scale.body, c.scale),
                color: t.palette.fg,
                opacity: 0.85,
                marginBottom: px(6, c.scale),
              }}
            >
              {l}
            </div>
          ))}
        </div>
      );
  }
}
