import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  component: () => {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    async function send() {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (!error) setSent(true);
    }

    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-8">
        <h1 className="font-medium text-lg">Entrar</h1>
        {sent ? (
          <p className="text-neutral-600 text-sm">Revisa tu correo.</p>
        ) : (
          <>
            <input
              className="border-line rounded-md border px-3 py-2 text-sm"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              onClick={send}
              className="border-line rounded-md border px-3 py-2 text-sm"
            >
              Enviar enlace
            </button>
          </>
        )}
        <button type="button" onClick={() => nav({ to: "/" })} className="text-neutral-400 text-xs">
          Volver
        </button>
      </div>
    );
  },
});
