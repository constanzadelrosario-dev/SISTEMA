import { PRESETS, TEMA_BASE, type ThemeTokens } from "@sistema/deck";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ThemeRow = {
  id: string;
  name: string;
  tokens: ThemeTokens;
  origin: string;
  is_favorite: boolean;
};

export async function listThemes(sb: SupabaseClient, workspaceId: string): Promise<ThemeRow[]> {
  const { data, error } = await sb
    .from("deck_themes")
    .select("id,name,tokens,origin,is_favorite")
    .eq("workspace_id", workspaceId)
    .order("is_favorite", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ThemeRow[];
}

/** Devuelve el tema pedido, o la base si aún no hay ninguno guardado. */
export async function resolveTheme(
  sb: SupabaseClient,
  themeId?: string | null,
): Promise<ThemeTokens> {
  if (!themeId) return TEMA_BASE;
  const { data } = await sb.from("deck_themes").select("tokens").eq("id", themeId).maybeSingle();
  return (data?.tokens as ThemeTokens) ?? TEMA_BASE;
}

export async function saveThemes(
  sb: SupabaseClient,
  workspaceId: string,
  themes: Array<{ name: string; origin: string; tokens: ThemeTokens; referenceId?: string }>,
): Promise<ThemeRow[]> {
  const { data, error } = await sb
    .from("deck_themes")
    .insert(
      themes.map((t) => ({
        workspace_id: workspaceId,
        name: t.name,
        tokens: t.tokens,
        origin: t.origin,
        reference_id: t.referenceId ?? null,
      })),
    )
    .select("id,name,tokens,origin,is_favorite");
  if (error) throw error;
  return (data ?? []) as ThemeRow[];
}

/** Registra qué temas se mostraron y cuál se eligió. Alimenta la preferencia. */
export async function recordThemeChoice(
  sb: SupabaseClient,
  workspaceId: string,
  args: { artifactId?: string; artifactKind?: string; shown: string[]; chosen: string },
): Promise<void> {
  await sb.from("theme_choices").insert({
    workspace_id: workspaceId,
    artifact_id: args.artifactId ?? null,
    artifact_kind: args.artifactKind ?? null,
    shown: args.shown,
    chosen: args.chosen,
  });
}

/**
 * Siembra los temas extraídos de decks reales.
 * Idempotente: si ya hay temas en el workspace, no hace nada.
 */
export async function seedPresets(sb: SupabaseClient, workspaceId: string): Promise<ThemeRow[]> {
  const existing = await listThemes(sb, workspaceId);
  if (existing.length > 0) return existing;
  return saveThemes(
    sb,
    workspaceId,
    PRESETS.map((p) => ({ name: p.name, origin: "manual", tokens: p.tokens })),
  );
}
