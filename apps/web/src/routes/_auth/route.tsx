import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    // Garantiza el primer workspace. Idempotente: si ya existe, devuelve el
    // suyo. Sin esto, la primera server function falla con "Sin workspace
    // asignado". Ver migración 20260804000100_bootstrap_workspace.sql.
    await supabase.rpc("bootstrap_workspace");
  },
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
