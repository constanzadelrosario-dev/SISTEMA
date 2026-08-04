-- 06 · Runtime de agentes, prompts versionados y artefactos.

create table prompt_versions (
  id         uuid primary key default gen_random_uuid(),
  agent_id   text not null,
  version    int not null,
  system     text not null,
  hash       text not null,
  notes      text,
  created_at timestamptz not null default now(),
  unique (agent_id, version)
);

create table agent_runs (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  project_id        uuid references projects(id) on delete cascade,
  agent_id          text not null,
  pack              text not null,   -- eje | ads | voz | deck | marca | campus
  prompt_version_id uuid references prompt_versions(id),
  context_source    text not null default 'brain',  -- brain | manual | mixed
  input             jsonb not null,
  output            jsonb,
  sources_used      jsonb not null default '[]'::jsonb,
  missing_data      jsonb not null default '[]'::jsonb,
  provider          text,
  model             text,
  tokens_in         int,
  tokens_out        int,
  latency_ms        int,
  error             text,
  created_at        timestamptz not null default now()
);
create index agent_runs_idx on agent_runs (workspace_id, agent_id, created_at desc);

create type artifact_status as enum
  ('borrador','revision','aprobado','publicado','archivado');

create table artifacts (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  project_id      uuid references projects(id) on delete cascade,
  kind            text not null,    -- pieza | anuncio | post | guion | deck | doc
  subtype         text,
  channel         text,
  audience        text,
  framework       text,
  objective       text,             -- valor | conexion | conversion | autoridad
  title           text,
  body            text,
  payload         jsonb,            -- estructura tipada (p. ej. el Deck completo)
  current_version int not null default 1,
  status          artifact_status not null default 'borrador',
  created_by      uuid references auth.users(id) on delete set null,
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index artifacts_idx on artifacts (workspace_id, kind, status);
create trigger artifacts_touch before update on artifacts
  for each row execute function touch_updated_at();

create table artifact_versions (
  id                uuid primary key default gen_random_uuid(),
  artifact_id       uuid not null references artifacts(id) on delete cascade,
  version           int not null,
  body              text,
  payload           jsonb,
  agent_run_id      uuid references agent_runs(id) on delete set null,
  sources_used      jsonb not null default '[]'::jsonb,
  checks            jsonb,
  guardrail_profile text,     -- con qué perfil se generó
  context_source    text,     -- brain | manual | mixed
  review_index      int,      -- 0-100 interno; se muestra como banda
  created_at        timestamptz not null default now(),
  unique (artifact_id, version)
);

alter table prompt_versions   enable row level security;
alter table agent_runs        enable row level security;
alter table artifacts         enable row level security;
alter table artifact_versions enable row level security;

create policy prompts_read on prompt_versions for select to authenticated using (true);
create policy runs_member  on agent_runs for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy arts_member  on artifacts  for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy vers_member  on artifact_versions for all to authenticated
  using (exists (select 1 from artifacts a where a.id = artifact_id and is_member(a.workspace_id)))
  with check (exists (select 1 from artifacts a where a.id = artifact_id and is_member(a.workspace_id)));
