-- 08 · Revisión (ex "score") y bucle de aprendizaje.
-- Nomenclatura deliberada: no es una medición psicométrica validada.
-- Es la lectura de un modelo. Se guarda un índice interno y se muestra una banda.

create table rubrics (
  id           text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  threshold    int not null default 70,   -- umbral de revisión, no de calidad
  weighting    jsonb not null default '{}'::jsonb
);

create table rubric_dimensions (
  id        text primary key,
  rubric_id text not null references rubrics(id) on delete cascade,
  label     text not null,
  category  text,
  weight    numeric not null default 1
);

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  artifact_id   uuid references artifacts(id) on delete cascade,
  version       int,
  rubric_id     text not null references rubrics(id),
  objective     text,
  index_value   int not null,          -- 0-100, uso interno
  band          text not null,         -- solido | aceptable | flojo
  runs          int not null default 1,-- nº de pasadas
  spread        numeric,               -- dispersión entre pasadas
  needs_look    boolean not null default false,
  created_at    timestamptz not null default now()
);

create table review_scores (
  review_id    uuid not null references reviews(id) on delete cascade,
  dimension_id text not null references rubric_dimensions(id),
  value        numeric not null,
  rationale    text,
  evidence     text,
  primary key (review_id, dimension_id)
);

create table lessons (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  title         text not null,
  dimension_id  text references rubric_dimensions(id),
  level         text,
  trigger_below numeric,
  media_url     text,
  content       jsonb,
  created_at    timestamptz not null default now()
);

create table recommendations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  trigger_type text not null,   -- revision_baja | gap | chequeo_fallido | meseta
  trigger_ref  text,
  action_kind  text not null,   -- leccion | llenar_dato | correr_agente | herramienta
  action_ref   text,
  reason       text,
  dismissed    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table lesson_events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lesson_id    uuid references lessons(id) on delete cascade,
  action       text not null check (action in ('open','tryit')),
  created_at   timestamptz not null default now()
);

alter table rubrics         enable row level security;
alter table reviews         enable row level security;
alter table lessons         enable row level security;
alter table recommendations enable row level security;
alter table lesson_events   enable row level security;
create policy rub_read  on rubrics for select to authenticated using (true);
create policy rev_member on reviews for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy les_member on lessons for all to authenticated using (workspace_id is null or is_member(workspace_id)) with check (is_member(workspace_id));
create policy rec_member on recommendations for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy lev_member on lesson_events for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
