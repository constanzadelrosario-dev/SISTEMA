import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
