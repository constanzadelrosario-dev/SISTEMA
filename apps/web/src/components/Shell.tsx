import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GROUP_LABEL, MODULES, type ModuleDef } from "@/modules/registry";

function Item({ m, active }: { m: ModuleDef; active: boolean }) {
  const Icon = m.icon;
  const base = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm";

  if (!m.enabled) {
    return (
      <div className={`${base} text-neutral-400`} title="Por construir">
        <Icon className="size-4" aria-hidden />
        {m.label}
      </div>
    );
  }
  return (
    <Link
      to={m.path}
      className={`${base} ${active ? "bg-white text-neutral-900" : "text-neutral-600 hover:bg-white/60"}`}
    >
      <Icon className="size-4" aria-hidden />
      {m.label}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const groups = ["entrada", "conocimiento", "produccion", "salida"] as const;

  return (
    <div className="grid min-h-screen grid-cols-[200px_1fr] bg-soft">
      <nav className="border-line border-r p-3">
        <Link to="/" className="mb-4 block px-2 font-medium text-sm">
          Sistema
        </Link>
        {groups.map((g) => (
          <div key={g} className="mb-3">
            <div className="px-2 pb-1 text-[11px] text-neutral-400 uppercase tracking-wider">
              {GROUP_LABEL[g]}
            </div>
            {MODULES.filter((m) => m.group === g).map((m) => (
              <Item key={m.id} m={m} active={path.startsWith(m.path)} />
            ))}
          </div>
        ))}
      </nav>
      <main className="bg-white p-6">{children}</main>
    </div>
  );
}
