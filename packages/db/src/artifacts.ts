import type { Deck } from "@sistema/deck";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Capa de acceso. Ningún módulo consulta tablas directamente: si el esquema
 * cambia, cambia acá y en ningún otro lado.
 */

export type ArtifactRow = {
  id: string;
  kind: string;
  subtype: string | null;
  title: string | null;
  status: string;
  current_version: number;
  payload: Deck;
  updated_at: string;
};

export async function listDecks(sb: SupabaseClient, workspaceId: string): Promise<ArtifactRow[]> {
  const { data, error } = await sb
    .from("artifacts")
    .select("id,kind,subtype,title,status,current_version,payload,updated_at")
    .eq("workspace_id", workspaceId)
    .eq("kind", "deck")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDeck(
  sb: SupabaseClient,
  id: string,
): Promise<{ row: ArtifactRow; deck: Deck }> {
  const { data, error } = await sb
    .from("artifacts")
    .select("id,kind,subtype,title,status,current_version,payload,updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { row: data as ArtifactRow, deck: data.payload as Deck };
}

export async function createDeck(
  sb: SupabaseClient,
  workspaceId: string,
  deck: Deck,
  opts: { subtype?: string; themeId?: string } = {},
): Promise<string> {
  const { data, error } = await sb
    .from("artifacts")
    .insert({
      workspace_id: workspaceId,
      kind: "deck",
      subtype: opts.subtype ?? null,
      title: deck.meta.title,
      payload: { ...deck, themeId: opts.themeId ?? deck.themeId },
      status: "borrador",
    })
    .select("id")
    .single();
  if (error) throw error;

  await sb.from("artifact_versions").insert({
    artifact_id: data.id,
    version: 1,
    payload: deck,
    context_source: "manual",
  });
  return data.id as string;
}

/** Guarda una versión nueva. El historial es real, no un contador. */
export async function saveDeckVersion(
  sb: SupabaseClient,
  artifactId: string,
  deck: Deck,
  meta: { contextSource?: string; guardrailProfile?: string; checks?: unknown } = {},
): Promise<number> {
  const { data: art, error: e1 } = await sb
    .from("artifacts")
    .select("current_version")
    .eq("id", artifactId)
    .single();
  if (e1) throw e1;

  const version = (art.current_version as number) + 1;
  const { error: e2 } = await sb.from("artifact_versions").insert({
    artifact_id: artifactId,
    version,
    payload: deck,
    context_source: meta.contextSource ?? "manual",
    guardrail_profile: meta.guardrailProfile ?? null,
    checks: meta.checks ?? null,
  });
  if (e2) throw e2;

  const { error: e3 } = await sb
    .from("artifacts")
    .update({ current_version: version, payload: deck, title: deck.meta.title })
    .eq("id", artifactId);
  if (e3) throw e3;
  return version;
}
