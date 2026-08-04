-- 09 · Módulo de marca: 29 herramientas en 7 fases (0 = límites).

create table brand_tools (
  id          text primary key,
  phase       int not null,           -- 0..6
  name        text not null,
  author      text,
  cathedra_id uuid references cathedras(id) on delete set null,
  minutes     int,
  has_test    boolean not null default false,
  has_graphic boolean not null default false,
  theory      text,
  steps       jsonb,
  pitfalls    jsonb,
  outputs     jsonb   -- claves del Cerebro que produce
);

create table brand_tool_runs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool_id      text not null references brand_tools(id),
  status       text not null default 'pendiente',
  responses    jsonb,
  output       jsonb,
  reviewed     boolean not null default false,
  started_at   timestamptz,
  completed_at timestamptz
);

-- El 360° sí es un instrumento: informantes, anonimato y n mínimo.
create table assessment_360 (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  token        text not null unique,
  relation     text,     -- jefe | par | cliente | subordinado | mentor | amigo
  responses    jsonb,
  submitted_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Regla de proporción: se implementa en la fase 2, antes del módulo editorial.
create table proportion_weeks (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  week_start   date not null,
  published    int not null default 0,
  built        boolean not null default false,
  primary key (workspace_id, week_start)
);

alter table brand_tools     enable row level security;
alter table brand_tool_runs enable row level security;
alter table assessment_360  enable row level security;
alter table proportion_weeks enable row level security;
create policy bt_read   on brand_tools for select to authenticated using (true);
create policy btr_member on brand_tool_runs for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy a360_member on assessment_360 for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy pw_member  on proportion_weeks for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
