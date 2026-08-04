import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { serverClient } from "./server";

/** Exige sesión y expone { userId, workspaceId, sb } al handler. */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const req = getRequest();
  const token = req?.headers.get("authorization")?.replace("Bearer ", "");
  const sb = serverClient(token);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new Error("No autenticado");

  const { data: m } = await sb
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .single();
  if (!m) throw new Error("Sin workspace asignado");

  return next({ context: { userId: data.user.id, workspaceId: m.workspace_id, sb } });
});
