import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createDeck, getDeck, listDecks, saveDeckVersion } from "@sistema/db";
import { listThemes, resolveTheme, saveThemes, seedPresets } from "@sistema/db";
import { DECK_EJEMPLO, Deck, TEMA_BASE, generarAlternativas } from "@sistema/deck";
import { requireAuth } from "@/lib/supabase/middleware";

export const fnListDecks = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => listDecks(context.sb, context.workspaceId));

export const fnGetDeck = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { row, deck } = await getDeck(context.sb, data.id);
    const theme = await resolveTheme(context.sb, deck.themeId);
    return { row, deck, theme };
  });

export const fnCreateDeck = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { deck?: unknown; subtype?: string }) =>
    z.object({ deck: Deck.optional(), subtype: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    // Los presets se siembran en el primer deck: nunca arrancas con la
    // biblioteca de temas vacía.
    await seedPresets(context.sb, context.workspaceId);
    return createDeck(context.sb, context.workspaceId, data.deck ?? DECK_EJEMPLO, { subtype: data.subtype });
  });

export const fnSaveDeck = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; deck: unknown }) =>
    z.object({ id: z.string().uuid(), deck: Deck }).parse(d))
  .handler(async ({ data, context }) => saveDeckVersion(context.sb, data.id, data.deck));

export const fnListThemes = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => listThemes(context.sb, context.workspaceId));

/**
 * Cuatro alternativas: fiel, dos variaciones de un eje cada una, y un contraste
 * deliberado. El contraste existe para que el sistema no te encierre en lo que
 * ya te gusta.
 */
export const fnGenerarTemas = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { baseThemeId?: string }) =>
    z.object({ baseThemeId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const base = data.baseThemeId ? await resolveTheme(context.sb, data.baseThemeId) : TEMA_BASE;
    const alternativas = generarAlternativas(base, ["fonts", "density"]);
    return saveThemes(context.sb, context.workspaceId, alternativas.map((a) => ({
      name: a.name, origin: a.origin, tokens: a.tokens,
    })));
  });
