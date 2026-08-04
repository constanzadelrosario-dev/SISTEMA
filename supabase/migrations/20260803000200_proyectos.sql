-- 02 · Proyectos. Reemplaza frente / projects / talks / batch_summaries.

create type project_kind as enum
  ('frente', 'campana_ads', 'charla', 'ingesta', 'deck', 'marca');

create table projects (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  kind              project_kind not null,
  slug              text not null,
  name              text not null,
  status            text not null default 'activo',
  domain            text not null default 'general',
    -- salud_mental | comercial | academico | general. Decide los guardrails.
  awareness_level   text,
    -- escala de Schwartz: inconsciente | problema | solucion | producto | cliente
  guardrail_profile text,
  data              jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (workspace_id, slug)
);
create index projects_ws_kind_idx on projects (workspace_id, kind);
create trigger projects_touch before update on projects
  for each row execute function touch_updated_at();

alter table projects enable row level security;
create policy projects_member on projects
  for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
